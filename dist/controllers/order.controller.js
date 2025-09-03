"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundOrder = exports.handlePaymentFailure = exports.markOrderAsPaid = exports.updateDeliveryStatus = exports.updatePaymentStatus = exports.updateOrderStatus = exports.getVendorOrders = exports.getUserOrders = exports.getAllOrders = exports.getCustomerOrders = exports.paidOrders = exports.getOrderDetails = exports.placeOrder = exports.initiatePayment = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// src/controllers/checkout.controller.ts 
// POST /api/payments/initiate
const initiatePayment = async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        const { cartId, amount, method } = req.body;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        if (!cartId)
            return res.status(400).json({ error: "No Order Found" });
        // 1. Generate transaction reference
        const reference = `TX-${Date.now()}-${userId}`;
        // 2. Save transaction in DB
        const transaction = await prisma_1.default.transaction.create({
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
    }
    catch (err) {
        console.error("Payment init error", err);
        res.status(500).json({ error: "Failed to initiate payment" });
    }
};
exports.initiatePayment = initiatePayment;
// src/controllers/order.controller.ts
const placeOrder = async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        const { addressId, shippingFee, transactionId } = req.body;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        // 1. Verify transaction
        const transaction = await prisma_1.default.transaction.findFirst({
            where: { reference: transactionId },
        });
        if (!transaction || transaction.status !== "success") {
            return res.status(400).json({ error: "Payment not confirmed" });
        }
        // 2. Fetch user's cart
        const cart = await prisma_1.default.cart.findFirst({
            where: { userId },
            include: { items: { include: { product: true, variant: true } } },
        });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }
        // 3. Calculate totals
        const subtotal = cart.items.reduce((sum, item) => sum + (item.variant?.price ?? item.product.price) * item.quantity, 0);
        const total = subtotal + (shippingFee ?? 0);
        // 4. Create the order safely
        const order = await prisma_1.default.order.create({
            data: {
                status: "pending",
                subtotal,
                shippingFee: shippingFee ?? 0,
                totalAmount: total,
                customer: { connect: { id: userId } },
                address: addressId ? { connect: { id: addressId } } : undefined,
                items: {
                    create: cart.items.map((item) => ({
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
        // 5. Link transaction back to order
        await prisma_1.default.transaction.update({
            where: { id: transaction.id },
            data: { orderId: order.id },
        });
        // 6. Clear cart items
        await prisma_1.default.cartItem.deleteMany({ where: { cartId: cart.id } });
        res.json({ success: true, order });
    }
    catch (err) {
        console.error("Checkout error:", err);
        res.status(500).json({ error: "Checkout failed" });
    }
};
exports.placeOrder = placeOrder;
const getOrderDetails = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await prisma_1.default.order.findUnique({
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
    }
    catch (error) {
        console.error("❌ Fetching order details failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getOrderDetails = getOrderDetails;
const paidOrders = async (req, res) => {
    await prisma_1.default.order.findMany({
        where: { paymentStatus: "paid" },
    });
};
exports.paidOrders = paidOrders;
const getCustomerOrders = async (req, res) => {
    const { userId } = req.params;
    try {
        const orders = await prisma_1.default.order.findMany({
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
    }
    catch (error) {
        console.error("❌ Error fetching customer orders:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getCustomerOrders = getCustomerOrders;
// Get all orders for a customer (user)
const getAllOrders = async (req, res) => {
    try {
        const orders = await prisma_1.default.order.findMany({
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
    }
    catch (error) {
        console.error("❌ Failed to fetch user orders:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllOrders = getAllOrders;
// Get all orders for a customer (user)
const getUserOrders = async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid userId" });
    }
    try {
        const orders = await prisma_1.default.order.findMany({
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
    }
    catch (error) {
        console.error("❌ Failed to fetch user orders:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getUserOrders = getUserOrders;
// Get all orders for a specific vendor
const getVendorOrders = async (req, res) => {
    const vendorId = parseInt(req.params.vendorId);
    if (isNaN(vendorId)) {
        return res.status(400).json({ error: "Invalid vendorId" });
    }
    try {
        const orders = await prisma_1.default.order.findMany({
            where: { vendorId },
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
    }
    catch (error) {
        console.error("❌ Failed to fetch vendor orders:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getVendorOrders = getVendorOrders;
const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || "0.1");
const updateOrderStatus = async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    try {
        const order = await prisma_1.default.order.findUnique({ where: { id: orderId } });
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
        const updated = await prisma_1.default.order.update({
            where: { id: orderId },
            data: {
                status,
                vendorEarning,
                platformFee,
            },
        });
        return res.json(updated);
    }
    catch (err) {
        console.error("Error updating order status:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const updatePaymentStatus = async (req, res) => {
    const { orderId } = req.params;
    const { paymentStatus, refundReason } = req.body;
    try {
        const updatedOrder = await prisma_1.default.order.update({
            where: { id: Number(orderId) },
            data: {
                paymentStatus,
                refundReason,
            },
        });
        return res.json({ message: "Payment status updated", order: updatedOrder });
    }
    catch (error) {
        console.error("Error updating payment status:", error);
        return res.status(500).json({ error: "Failed to update payment status" });
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
// Update Delivery Status
const updateDeliveryStatus = async (req, res) => {
    const { orderId } = req.params;
    const { deliveryStatus, longitude, latitude } = req.body;
    try {
        const order = await prisma_1.default.order.update({
            where: { id: Number(orderId) },
            data: {
                deliveryStatus,
                longitude,
                latitude,
            },
        });
        res.json({ message: "Delivery status updated", order });
    }
    catch (error) {
        console.error("Error updating delivery status:", error);
        res.status(500).json({ error: "Failed to update delivery status" });
    }
};
exports.updateDeliveryStatus = updateDeliveryStatus;
// Mark Order as Paid
const markOrderAsPaid = async (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod, paymentRef } = req.body;
    try {
        const updatedOrder = await prisma_1.default.order.update({
            where: { id: Number(orderId) },
            data: {
                paymentStatus: "paid",
                paymentMethod,
                paymentRef,
                paymentDate: new Date(),
            },
        });
        res.status(200).json(updatedOrder);
    }
    catch (error) {
        console.error("❌ Payment tracking error:", error);
        res.status(500).json({ error: "Failed to update payment status" });
    }
};
exports.markOrderAsPaid = markOrderAsPaid;
// Example handler for payment failure webhook or result
const handlePaymentFailure = async (req, res) => {
    const { orderId, errorMessage } = req.body;
    try {
        const order = await prisma_1.default.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "failed",
                status: "failed",
                paymentError: errorMessage,
            },
        });
        return res.status(200).json({ message: "Payment failure logged", order });
    }
    catch (err) {
        console.error("Payment failure logging error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.handlePaymentFailure = handlePaymentFailure;
// Admin or system refund
const refundOrder = async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { reason } = req.body;
    try {
        const order = await prisma_1.default.order.findUnique({ where: { id: orderId } });
        if (!order || order.paymentStatus !== "paid") {
            return res.status(400).json({ error: "Invalid order for refund" });
        }
        const updated = await prisma_1.default.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "refunded",
                status: "refunded",
                refundReason: reason,
            },
        });
        // You can also call a real refund API here, e.g., Flutterwave/Stripe
        return res.status(200).json({ message: "Order refunded", order: updated });
    }
    catch (err) {
        console.error("Refund error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.refundOrder = refundOrder;
