"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewAllPayments = exports.viewPayment = exports.verifyPayment = exports.initiatePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const initiatePayment = async (req, res) => {
    try {
        const { email, amount } = req.body;
        if (!email || !amount)
            return res.status(400).json({ error: "Email and amount are required" });
        const { data: paystackData } = await axios_1.default.post("https://api.paystack.co/transaction/initialize", {
            email,
            amount: amount * 100, // Paystack expects kobo
            currency: "GHS",
            callback_url: `${process.env.VITE_BASE_URL ?? "http://localhost:5173"}/customer/checkout`,
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });
        const { authorization_url, reference } = paystackData.data;
        await prisma_1.default.transaction.create({
            data: {
                reference,
                method: "Paystack",
                amount,
                status: "initiated",
                rawData: paystackData,
            },
        });
        res.json({ authorizationUrl: authorization_url, transactionId: reference });
    }
    catch (err) {
        console.error("Paystack init error:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to initiate payment" });
    }
};
exports.initiatePayment = initiatePayment;
const verifyPayment = async (req, res) => {
    try {
        let reference = req.query.reference || "";
        if (!reference)
            return res.status(400).json({ error: "Reference is required" });
        if (Array.isArray(reference))
            reference = reference[0];
        reference = reference.toString();
        const { data: paystackData } = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
        if (paystackData.data.status !== "success")
            return res.status(400).json({ success: false, error: "Payment failed" });
        const transactionRecord = await prisma_1.default.transaction.findFirst({ where: { reference } });
        if (!transactionRecord)
            return res.status(404).json({ error: "Transaction not found" });
        await prisma_1.default.transaction.update({
            where: { id: transactionRecord.id },
            data: { status: "success", rawData: paystackData },
        });
        res.json({ success: true, transactionId: reference });
    }
    catch (err) {
        console.error("Paystack verify error:", err.response?.data || err.message);
        res.status(500).json({ error: "Payment verification failed" });
    }
};
exports.verifyPayment = verifyPayment;
// --------------------- VIEW CUSTOMER PAYMENTS ---------------------
const viewPayment = async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const payments = await prisma_1.default.payment.findMany({
            where: { order: { customerId: userId } },
            include: { order: { select: { id: true, placedAt: true, status: true, totalAmount: true } } },
            orderBy: { paidAt: "desc" },
        });
        res.json(payments);
    }
    catch (err) {
        console.error("Error fetching payments:", err);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};
exports.viewPayment = viewPayment;
// --------------------- VIEW ALL PAYMENTS (ADMIN) ---------------------
const viewAllPayments = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(403).json({ error: "Forbidden: Admins only" });
        const getUser = await prisma_1.default.user.findFirst({ where: { id: Number(user.id) } });
        if (!getUser || !getUser.role?.toString().startsWith("ADMIN"))
            return res.status(403).json({ error: "Forbidden: Admins only" });
        const { status, customerId, fromDate, toDate } = req.query;
        const payments = await prisma_1.default.payment.findMany({
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
        res.json(payments);
    }
    catch (err) {
        console.error("Error fetching all payments:", err);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};
exports.viewAllPayments = viewAllPayments;
