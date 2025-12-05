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
 

 export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { email, cartData } = req.body;
    const userId = req.user?.id;
    const cartId = cartData?.id;

    // 1️⃣ VALIDATION
    if (!email || !cartId || !userId) {
      return res.status(400).json({ 
        error: "Email, cart ID, and user authentication are required" 
      });
    }

    // 2️⃣ LOAD CART WITH VENDOR DATA
    const cart = await prisma.cart.findUnique({
      where: { 
        id: Number(cartId), 
        userId: Number(userId) 
      },
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
            variant: true,
            size: true
          }
        }
      }
    });

    if (!cart) {
      return res.status(404).json({ 
        error: "Cart not found" 
      });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ 
        error: "Cart is empty" 
      });
    }

    // 3️⃣ GROUP ITEMS BY VENDOR AND CALCULATE TOTALS
    const vendorMap: Record<number, {
      vendorId: number;
      shopName: string;
      subaccountCode: string;
      itemTotalGHS: number; // In Ghana Cedis
      itemTotalPesewas: number; // In pesewas (1 GHS = 100 pesewas)
      items: any[];
    }> = {};

    let totalAmountGHS = 0;

    for (const item of cart.items) {
      const itemTotalGHS = item.price * item.quantity;
      totalAmountGHS += itemTotalGHS;
      const vendor = item.product.vendor;
      
      // Check if vendor has subaccount configured
      if (!vendor.subaccountCode) {
        return res.status(400).json({
          error: `Vendor ${vendor.shopName} is not configured for payments`,
          vendorId: vendor.id,
          vendorName: vendor.shopName
        });
      }
      
      // Initialize vendor in map if not present
      if (!vendorMap[vendor.id]) {
        vendorMap[vendor.id] = {
          vendorId: vendor.id,
          shopName: vendor.shopName,
          subaccountCode: vendor.subaccountCode,
          itemTotalGHS: 0,
          itemTotalPesewas: 0,
          items: []
        };
      }
      
      // Add to vendor totals
      vendorMap[vendor.id].itemTotalGHS += itemTotalGHS;
      vendorMap[vendor.id].items.push(item);
    }

    // 4️⃣ CALCULATE EXACT AMOUNTS IN PESEWAS
    const PLATFORM_COMMISSION_RATE = 0.01; // 1%
    const totalAmountPesewas = Math.round(totalAmountGHS * 100);
    
    const splitRules:any[] = [];
    let totalVendorPayoutPesewas = 0;
    const vendorCalculations:any[] = [];

    // Calculate each vendor's payout (99% of their items)
    Object.values(vendorMap).forEach(vendor => {
      const vendorTotalPesewas = Math.round(vendor.itemTotalGHS * 100);
      const vendorPayoutPesewas = Math.round(vendorTotalPesewas * (1 - PLATFORM_COMMISSION_RATE));
      
      // Store calculation for verification
      vendorCalculations.push({
        vendorName: vendor.shopName,
        vendorTotalGHS: vendor.itemTotalGHS,
        vendorTotalPesewas: vendorTotalPesewas,
        vendorPayoutGHS: vendorPayoutPesewas / 100,
        vendorPayoutPesewas: vendorPayoutPesewas,
        platformCommissionGHS: (vendorTotalPesewas * PLATFORM_COMMISSION_RATE) / 100
      });
      
      splitRules.push({
        subaccount: vendor.subaccountCode,
        share: vendorPayoutPesewas // EXACT amount vendor receives
      });
      
      totalVendorPayoutPesewas += vendorPayoutPesewas;
    });

    // Platform gets the remainder
    const platformFeePesewas = totalAmountPesewas - totalVendorPayoutPesewas;
    const platformFeeGHS = platformFeePesewas / 100;

    // 5️⃣ VERIFICATION AND LOGGING
    console.log("=== PAYMENT SPLIT CALCULATION VERIFICATION ===");
    console.log("ORDER TOTAL:", totalAmountGHS.toFixed(2), "GHS =", totalAmountPesewas, "pesewas");
    console.log("");
    
    vendorCalculations.forEach((calc, index) => {
      console.log(`VENDOR ${index + 1} (${calc.vendorName}):`);
      console.log(`  Items Value: ${calc.vendorTotalGHS.toFixed(2)} GHS = ${calc.vendorTotalPesewas} pesewas`);
      console.log(`  Receives (99%): ${calc.vendorPayoutGHS.toFixed(2)} GHS = ${calc.vendorPayoutPesewas} pesewas`);
      console.log(`  Platform Commission (1%): ${calc.platformCommissionGHS.toFixed(2)} GHS`);
      console.log("");
    });
    
    console.log("SUMMARY:");
    console.log(`Total Vendor Payout: ${(totalVendorPayoutPesewas/100).toFixed(2)} GHS = ${totalVendorPayoutPesewas} pesewas`);
    console.log(`Platform Commission: ${platformFeeGHS.toFixed(2)} GHS = ${platformFeePesewas} pesewas`);
    console.log(`Total: ${((totalVendorPayoutPesewas + platformFeePesewas)/100).toFixed(2)} GHS = ${totalVendorPayoutPesewas + platformFeePesewas} pesewas`);
    console.log(`Expected Total: ${totalAmountGHS.toFixed(2)} GHS = ${totalAmountPesewas} pesewas`);
    
    // Verify math
    const calculationError = Math.abs((totalVendorPayoutPesewas + platformFeePesewas) - totalAmountPesewas);
    if (calculationError > 1) { // Allow 1 pesewa rounding error
      console.error("❌ CALCULATION ERROR: Totals don't match!");
      console.error(`Discrepancy: ${calculationError} pesewas`);
      return res.status(500).json({
        error: "Payment calculation error",
        details: `Calculation discrepancy: ${calculationError} pesewas`
      });
    }
    
    console.log("✅ Calculation verified");
    console.log("=== END VERIFICATION ===");

    // 6️⃣ CALL PAYSTACK API
        const vendorNames = Object.values(vendorMap).map(v => v.shopName);
        const displayVendorName = vendorNames.length === 1 
        ? vendorNames[0] 
        : `${vendorNames[0]} & ${vendorNames.length - 1} other${vendorNames.length > 2 ? 's' : ''}`;

    console.log("Initiating payment for:", displayVendorName);
    const { data: paystackData } : any = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: totalAmountPesewas,
        currency: "GHS",
        callback_url: `${process.env.VITE_BASE_URL}/customer/payment-callback`,
        metadata: {
          custom_fields: [
            {
              display_name: "Order For",
              variable_name: "vendor",
              value: displayVendorName
            },
            {
              display_name: "Items",
              variable_name: "item_count",
              value: cart.items.length.toString()
            },
            {
              display_name: "Vendors",
              variable_name: "vendor_count",
              value: Object.keys(vendorMap).length.toString()
            }
          ],
          // Internal metadata
          cartId,
          userId,
          totalAmountGHS,
          vendorCount: Object.keys(vendorMap).length,
          vendorDetails: vendorCalculations.map(v => ({
            name: v.vendorName,
            amount: v.vendorTotalGHS,
            payout: v.vendorPayoutGHS
          })),
          platformCommissionGHS: platformFeeGHS
        },
        split: {
          type: "flat", // CRITICAL: Flat amounts, not percentages
          currency: "GHS",
          subaccounts: splitRules, // Only vendor subaccounts
          bearer_type: "subaccount", // Each vendor bears their own charges
          bearer_subaccount: splitRules[0]?.subaccount // First vendor bears main charge
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    if (!paystackData.status) {
      console.error("Paystack API Error Response:", paystackData);
      return res.status(400).json({ 
        error: "Payment gateway error",
        details: paystackData.message,
        paystackData: paystackData
      });
    }

    // 7️⃣ SAVE TRANSACTION RECORD
    await prisma.transaction.create({
      data: {
        reference: paystackData.data.reference,
        method: "paystack",
        amount: totalAmountGHS,
        status: "initiated",
        platformFee: platformFeeGHS,
        rawData: JSON.stringify({
          paystackResponse: paystackData,
          cartId,
          vendorCalculations,
          splitRules,
          totalAmountPesewas,
          platformCommissionRate: PLATFORM_COMMISSION_RATE
        }),
      }
    });

    console.log(`✅ PAYMENT INITIATED SUCCESSFULLY`);
    console.log(`Reference: ${paystackData.data.reference}`);
    console.log(`Amount: ${totalAmountGHS} GHS`);
    console.log(`Vendors: ${Object.keys(vendorMap).length}`);
    console.log(`Authorization URL: ${paystackData.data.authorization_url}`);

    // 8️⃣ RETURN SUCCESS RESPONSE
    res.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      amount: totalAmountGHS,
      vendorCount: Object.keys(vendorMap).length,
      platformCommission: platformFeeGHS,
      message: "Payment initialized successfully. Redirect to authorization URL."
    });

  } catch (error: any) {
    console.error("❌ PAYMENT INITIATION ERROR:");
    console.error("Error:", error.message);
    
    if (error.response) {
      console.error("Response Data:", error.response.data);
      console.error("Response Status:", error.response.status);
      
      if (error.response.status === 401) {
        return res.status(500).json({ 
          error: "Invalid Paystack API credentials",
          details: "Check your PAYSTACK_SECRET_KEY in .env file"
        });
      }
      
      return res.status(error.response.status).json({
        error: "Payment gateway error",
        details: error.response.data?.message || error.message,
        paystackError: error.response.data
      });
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