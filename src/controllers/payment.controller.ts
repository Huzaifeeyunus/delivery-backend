// src/controllers/payments.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import prisma from "../lib/prisma";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

// Validate Paystack key on startup
if (!PAYSTACK_SECRET_KEY) {
  console.error("❌ PAYSTACK_SECRET_KEY is missing from environment variables");
} else if (PAYSTACK_SECRET_KEY.startsWith('pk_')) {
  console.error("❌ PAYSTACK_SECRET_KEY should be a SECRET key (sk_test_...), not a PUBLIC key (pk_test_...)");
}

// --------------------- INITIATE PAYMENT ---------------------
interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    reference: string;
    [key: string]: any;
  };
}

export const initiatePaymentttt = async (req: Request, res: Response) => {
  try {
    const { email, amount, orderId } = req.body;
    
    // Validate required fields
    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required" });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: "Payment configuration error" });
    }

    // Validate amount (minimum 1 GHS = 100 pesewas)
    const amountInPesewas = Math.round(amount * 100);
    if (amountInPesewas < 100) {
      return res.status(400).json({ error: "Amount must be at least 1 GHS" });
    }

    console.log("🔄 Initiating payment:", { email, amount, amountInPesewas });

    const { data: paystackData } = await axios.post<PaystackInitResponse>(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountInPesewas,
        currency: "GHS",
        callback_url: `${process.env.VITE_BASE_URL || "http://localhost:5173"}/customer/payment-callback`,
        metadata: {
          orderId: orderId || null,
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: orderId || "N/A"
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    if (!paystackData.status) {
      console.error("Paystack API error:", paystackData.message);
      return res.status(400).json({ error: paystackData.message });
    }

    const { authorization_url, reference } = paystackData.data;

    // Create transaction record
    await prisma.transaction.create({
      data: {
        reference,
        method: "paystack",
        amount: amount,
        status: "initiated",
        rawData: JSON.stringify(paystackData),
        orderId: orderId || null,
      },
    });

    console.log("✅ Payment initiated successfully:", reference);

    res.json({ 
      success: true,
      authorizationUrl: authorization_url, 
      reference: reference,
      message: "Payment initiated successfully"
    });

  } catch (err: any) {
    console.error("❌ Paystack init error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });

    if (err.response?.status === 401) {
      return res.status(500).json({ 
        error: "Invalid Paystack API key. Please check your secret key." 
      });
    } else if (err.response?.status === 400) {
      return res.status(400).json({ 
        error: err.response.data?.message || "Invalid payment request" 
      });
    } else if (err.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        error: "Payment request timeout. Please try again." 
      });
    }

    res.status(500).json({ 
      error: "Failed to initiate payment. Please try again." 
    });
  }
};
 
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { email, cartData } = req.body;
    const userId = req.user?.id;


    const cartId = cartData?.id;
    if (!email || !cartId || !userId) {
      return res.status(400).json({ 
        error: "Email, cartId, and user authentication are required" 
      });
    }

    // 1️⃣ Load cart with all related data
    const cart = await prisma.cart.findUnique({
      where: { id: Number(cartId), userId: Number(userId) },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    shopName: true,
                    subaccountCode: true
                  }
                }
              }
            },
            variant: {
              include: {
                color: true,
                sizes: true
              }
            },
            size: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 2️⃣ Calculate totals and vendor splits
    let totalAmount = 0;
    const vendorMap: Record<number, {
      vendorId: number;
      shopName: string;
      subaccountCode: string | null;
      itemTotal: number;
      items: any[];
    }> = {};

    // Calculate totals and group by vendor
    for (const item of cart.items) {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      
      const vendorId = item.product.vendor.id;
      
      if (!vendorMap[vendorId]) {
        vendorMap[vendorId] = {
          vendorId,
          shopName: item.product.vendor.shopName,
          subaccountCode: item.product.vendor.subaccountCode,
          itemTotal: 0,
          items: []
        };
      }
      
      vendorMap[vendorId].itemTotal += itemTotal;
      vendorMap[vendorId].items.push(item);
    }

    // 3️⃣ Validate all vendors have subaccounts
    const vendorsWithoutSubaccount = Object.values(vendorMap)
      .filter(v => !v.subaccountCode)
      .map(v => v.shopName);

    if (vendorsWithoutSubaccount.length > 0) {
      return res.status(400).json({
        error: "Some vendors are not configured for payments",
        details: `Vendors without subaccount: ${vendorsWithoutSubaccount.join(", ")}`
      });
    }

    // 4️⃣ Prepare Paystack split rules (platform takes 1%)
    const PLATFORM_PERCENTAGE = 1;
    const splitRules = Object.values(vendorMap).map(vendor => {
      const vendorSharePercentage = (vendor.itemTotal / totalAmount) * (100 - PLATFORM_PERCENTAGE);
      
      return {
        subaccount: vendor.subaccountCode,
        share: Number(vendorSharePercentage.toFixed(2))
      };
    });

    // 5️⃣ Call Paystack API
    const amountInPesewas = Math.round(totalAmount * 100);
    
    const { data: paystackData } : any = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountInPesewas,
        currency: "GHS",
        callback_url: `${process.env.VITE_BASE_URL}/customer/payment-callback`,
        metadata: {
          cartId,
          userId,
          totalAmount,
          vendorCount: Object.keys(vendorMap).length
        },
        split: {
          type: "percentage",
          currency: "GHS",
          subaccounts: splitRules,
          bearer_type: "account", // Vendors bear the transaction charges
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    if (!paystackData.status) {
      return res.status(400).json({ error: paystackData.message });
    }

    // 6️⃣ Create transaction record
    const tr = await prisma.transaction.create({
      data: {
        reference: paystackData.data.reference,
        method: "paystack",
        amount: totalAmount,
        status: "initiated",
        rawData: JSON.stringify({
          paystackResponse: paystackData,
          cartId,
          vendorMap,
          splitRules
        }),
      }
    });

    console.log(`✅ Payment initiated for cart ${cartId}:`, {
      reference: paystackData.data.reference,
      totalAmount,
      vendorCount: Object.keys(vendorMap).length
    });

    res.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      amount: totalAmount,
      vendorCount: Object.keys(vendorMap).length
    });

  } catch (error: any) {
    console.error("❌ Payment initiation error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ error: "Invalid Paystack API key" });
    }
    
    res.status(500).json({
      error: "Failed to initiate payment",
      details: error.message
    });
  }
};


// --------------------- VERIFY PAYMENT ---------------------
interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    [key: string]: any;
  };
}


// --------------------- VERIFY PAYMENT ---------------------
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    let reference = req.query.reference || req.body.reference || "";
    
    if (!reference) {
      return res.status(400).json({ error: "Reference is required" });
    }

    if (Array.isArray(reference)) {
      reference = reference[0];
    }
    reference = reference.toString();

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: "Payment configuration error" });
    }

    console.log("🔄 Verifying payment:", reference);

    const { data: paystackData } = await axios.get<PaystackVerifyResponse>(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { 
        headers: { 
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` 
        },
        timeout: 30000,
      }
    );

    if (!paystackData.status) {
      console.error("Paystack verification failed:", paystackData.message);
      return res.status(400).json({ 
        success: false, 
        error: paystackData.message 
      });
    }

    const transactionData = paystackData.data;

    // Find existing transaction
    let transactionRecord = await prisma.transaction.findFirst({ 
      where: { reference } 
    });

    if (!transactionRecord) {
      // Create transaction record if it doesn't exist
      transactionRecord = await prisma.transaction.create({
        data: {
          reference,
          method: "paystack",
          amount: transactionData.amount / 100, // Convert back to GHS
          status: transactionData.status,
          rawData: JSON.stringify(paystackData),
        },
      });
    } else {
      // Update existing transaction
      await prisma.transaction.update({
        where: { id: transactionRecord.id },
        data: { 
          status: transactionData.status, 
          rawData: JSON.stringify(paystackData)
        },
      });
    }

    console.log("✅ Payment verification result:", {
      reference,
      status: transactionData.status,
      amount: transactionData.amount
    });

    // FIX: Return the actual payment status from Paystack, not just API success
    if (transactionData.status === "success") {
      res.json({ 
        success: true, 
        reference: reference,
        amount: transactionData.amount / 100,
        status: transactionData.status, // ← THIS IS CRITICAL
        message: "Payment verified successfully"
      });
    } else {
      res.status(400).json({ 
        success: false, 
        reference: reference,
        status: transactionData.status, // ← THIS IS CRITICAL
        error: `Payment ${transactionData.status}` 
      });
    }

  } catch (err: any) {
    console.error("❌ Paystack verify error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });

    if (err.response?.status === 401) {
      return res.status(500).json({ 
        error: "Invalid Paystack API key" 
      });
    } else if (err.response?.status === 404) {
      return res.status(404).json({ 
        error: "Transaction not found" 
      });
    }

    res.status(500).json({ 
      error: "Payment verification failed. Please try again." 
    });
  }
};
// --------------------- VIEW CUSTOMER PAYMENTS ---------------------
export const viewPayment = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const payments = await prisma.payment.findMany({
      where: { order: { customerId: userId } },
      include: { 
        order: { 
          select: { 
            id: true, 
            placedAt: true, 
            status: true, 
            totalAmount: true 
          } 
        } 
      },
      orderBy: { paidAt: "desc" },
    });

    res.json({ success: true, payments });
  } catch (err: any) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// --------------------- VIEW ALL PAYMENTS (ADMIN) ---------------------
export const viewAllPayments = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(403).json({ error: "Forbidden: Admins only" });

    const getUser = await prisma.user.findFirst({ 
      where: { id: Number(user.id) },
      include: { roles: true }
    });
    
    if (!getUser || !getUser.roles.some(role => role.roleId === 1)) { // Assuming 1 is admin role ID
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    const { status, customerId, fromDate, toDate } = req.query;

    const payments = await prisma.payment.findMany({
      where: {
        status: status ? String(status) : undefined,
        order: {
          customerId: customerId ? Number(customerId) : undefined,
          placedAt: {
            gte: fromDate ? new Date(String(fromDate)) : undefined,
            lte: toDate ? new Date(String(toDate)) : undefined,
          },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            placedAt: true,
            status: true,
            totalAmount: true,
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    res.json({ success: true, payments });
  } catch (err: any) {
    console.error("Error fetching all payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};