import { Request, Response } from "express"; 
import { log } from "console";
import prisma from "../lib/prisma";
 

 // src/controllers/checkout.controller.ts 
// POST /api/payments/initiate
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const { cartId, amount, method } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if(!cartId) return res.status(400).json({ error: "No Order Found" });
    

    // 1. Generate transaction reference
    const reference = `TX-${Date.now()}-${userId}`;

    // 2. Save transaction in DB
    const transaction = await prisma.transaction.create({
      data: {
        orderId: cartId,
        method,
        amount,
        status: "initiated",
        reference,
        rawData: JSON.stringify({}), // keep external gateway data later
      },
    });

    // TODO: integrate with MOMO/Paystack API here

    res.json({ success: true, transaction });
  } catch (err) {
    console.error("Payment init error", err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

 

 // src/controllers/order.controller.ts
 export const placeOrder = async (req: Request, res: Response) => {
  let order = null;
  try {
    const userId = Number(req.user?.id);
    const { addressId, shippingFee, paymentReference } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // 1. Verify transaction
    const transaction = await prisma.transaction.findFirst({
      where: { reference: paymentReference },
    });

    if (!transaction || transaction.status !== "success") {
      return res.status(400).json({ error: "Payment not confirmed" });
    }

    // 2. Check if an order already exists for this transaction
    const existingOrder = await prisma.order.findFirst({
      where: {
        transactions: {
          some: { id: transaction.id }
        }
      }
    });
 
    if (existingOrder) { 
      return res.status(200).json({ 
        success: true, 
        order: existingOrder, 
        message: "Order already processed"
      });
    }
 
    // 3. Fetch user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: { include: { product: true, variant: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 4. Calculate totals
    const subtotal = cart.items.reduce(
      (sum: any, item: any) => sum + (item.variant?.price ?? item.product.price) * item.quantity,
      0
    );
    const total = subtotal + (shippingFee ?? 0); 
 
    // 5. Create the order safely
    order = await prisma.order.create({
      data: {
        status: "pending",
        subtotal,
        shippingFee: shippingFee ?? 0,
        totalAmount: total,
        customer: { connect: { id: userId } },
        address: addressId ? { connect: { id: addressId } } : undefined,
        items: {
          create: cart.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.variant?.price ?? item.product.price,
            subtotal: (item.variant?.price ?? item.product.price) * item.quantity,
          })),
        },
        payment: {
          create: {
            method: transaction.method,
            status: transaction.status,
            amount: transaction.amount,
            reference: transaction.reference,
            transactionId: transaction.id,
            paidAt: new Date(),
          },
        },
        transactions: {
          connect: [{ id: transaction.id }],
        },
      },
      include: { items: true, payment: true, transactions: true },
    });
 
    // 6. Link transaction back to order
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { orderId: order.id },
      });
    
    // 7. Clear cart items ONLY AFTER order is successfully created
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
 
    res.json({ success: true, order });
  } catch (err) {
    console.error("Checkout error:", err);
    
    // DON'T clear cart if order creation failed!
    // The cart items should remain so user can retry
    
    res.status(500).json({ 
      error: "Checkout failed. Please try again. Your cart items have been preserved.",
      preserveCart: true 
    });
  }
};

 

 
 export const getOrderDetails = async (req: Request, res: Response) => {
  const { orderId } = req.params; 
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        customer: true,
        payment: true,
        delivery: true,
        vendor: true,
        transactions: true,
        items: {
          include: { product: true },
        }
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("❌ Fetching order details failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const paidOrders = async(req: Request, res: Response) => {
    await prisma.order.findMany({
    where: { paymentStatus: "paid" },
  });
} 




export const getCustomerOrders = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const orders = await prisma.order.findMany({
      where: { customerId: Number(userId) },
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
        payment: true,
        delivery: true,
        vendor: true,
        transactions: true,
      },
      orderBy: {
        placedAt: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching customer orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Get all orders for a customer (user)
export const getAllOrders = async (req: Request, res: Response) => { 
 

  try {
    const orders = await prisma.order.findMany({ 
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        payment: true,
        delivery: true,
        vendor: true,
        transactions: true,
      },
      orderBy: {
        placedAt: "desc",
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Failed to fetch user orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// Get all orders for a customer (user)
export const getUserOrders = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  try {
    const orders = await prisma.order.findMany({ 
      where: { customerId: userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        payment: true,
        delivery: true,
        vendor: true,
        transactions: true,
      },
      orderBy: {
        placedAt: "desc",
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Failed to fetch user orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// Get all orders for a specific vendor  
 export const getVendorOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorId = req.user?.id;
 
    // Get all items for this vendor first
    const vendorItems = await prisma.orderItem.findMany({
      where: {
        product: {
          vendorId: vendorId
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            delivery: true,
            payment: true
          }
        }
      }
    });

    // Group items by order
    const ordersMap = new Map();
    
    vendorItems.forEach(item => {
      const orderId = item.orderId;
      
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          ...item.order,
          items: [],
          vendorTotal: 0
        });
      }
      
      const order = ordersMap.get(orderId);
      order.items.push({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      });
      order.vendorTotal += item.quantity * item.unitPrice;
    });

    const orders = Array.from(ordersMap.values())
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

    res.json(orders);
  } catch (error: any) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ error: 'Failed to fetch vendor orders' });
  }
};

export const updateVendorOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const vendorId = req.user?.id;
 
    // Verify vendor has items in this order
    const order = await prisma.order.findFirst({
      where: {
        id: Number(orderId),
        items: {
          some: {
            product: {
              vendorId: vendorId
            }
          }
        }
      }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found or not accessible' });
      return;
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};



const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || "0.1");
export const updateOrderStatus = async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body;
 
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
 
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If completed, calculate vendor earnings and platform fee
    let vendorEarning = order.vendorEarning;
    let platformFee = order.platformFee;

    if (status === "completed" && (vendorEarning === null || vendorEarning === undefined)) {
      const commission = COMMISSION_RATE * order.totalAmount;
      platformFee = commission;
      vendorEarning = order.totalAmount - commission;
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        vendorEarning,
        platformFee,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("Error updating order status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { paymentStatus, refundReason } = req.body;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        paymentStatus,
        refundReason,
      },
    });

    return res.json({ message: "Payment status updated", order: updatedOrder });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({ error: "Failed to update payment status" });
  }
};


// Update Delivery Status
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { deliveryStatus, longitude, latitude } = req.body;
 
  try {
    const order = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        deliveryStatus,
        longitude,
        latitude,
      },
    });

    res.json({ message: "Delivery status updated", order });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ error: "Failed to update delivery status" });
  }
};





// Mark Order as Paid
export const markOrderAsPaid = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { paymentMethod, paymentRef } = req.body; 
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        paymentStatus: "paid",
        paymentMethod,
        paymentRef,
        paymentDate: new Date(),
      },
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("❌ Payment tracking error:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
};

 
// Example handler for payment failure webhook or result
export const handlePaymentFailure = async (req: Request, res: Response) => {
  const { orderId, errorMessage } = req.body;

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "failed",
        status: "failed",
        paymentError: errorMessage,
      },
    });

    return res.status(200).json({ message: "Payment failure logged", order });
  } catch (err) {
    console.error("Payment failure logging error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Admin or system refund
export const refundOrder = async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const { reason } = req.body;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.paymentStatus !== "paid") {
      return res.status(400).json({ error: "Invalid order for refund" });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "refunded",
        status: "refunded",
        refundReason: reason,
      },
    });



    // You can also call a real refund API here, e.g., Flutterwave/Stripe
    return res.status(200).json({ message: "Order refunded", order: updated });
  } catch (err) {
    console.error("Refund error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// In your orders router 

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({where: {id: Number(orderId)}});
 /*    order()
      .populate('customer', 'name phone email')
      .populate('items.product', 'name')
      .populate('items.variant.color', 'name')
      .populate('items.size.size', 'name'); */

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};
 