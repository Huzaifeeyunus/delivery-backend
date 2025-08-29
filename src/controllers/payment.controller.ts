// src/controllers/payments.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import prisma from "../lib/prisma";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

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

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { email, amount } = req.body;
    if (!email || !amount)
      return res.status(400).json({ error: "Email and amount are required" });

    const { data: paystackData } = await axios.post<PaystackInitResponse>(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack expects kobo
        currency: "GHS",
        callback_url: `${process.env.VITE_BASE_URL ?? "http://localhost:5173"}/customer/checkout`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, reference } = paystackData.data;

    await prisma.transaction.create({
      data: {
        reference,
        method: "Paystack",
        amount,
        status: "initiated",
        rawData: paystackData as any,
      },
    });

    res.json({ authorizationUrl: authorization_url, transactionId: reference });
  } catch (err: any) {
    console.error("Paystack init error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

// --------------------- VERIFY PAYMENT ---------------------
interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    [key: string]: any;
  };
}

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    let reference = req.query.reference || "";
    if (!reference) return res.status(400).json({ error: "Reference is required" });
    if (Array.isArray(reference)) reference = reference[0];
    reference = reference.toString();

    const { data: paystackData } = await axios.get<PaystackVerifyResponse>(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    if (paystackData.data.status !== "success")
      return res.status(400).json({ success: false, error: "Payment failed" });

    const transactionRecord = await prisma.transaction.findFirst({ where: { reference } });
    if (!transactionRecord) return res.status(404).json({ error: "Transaction not found" });

    await prisma.transaction.update({
      where: { id: transactionRecord.id },
      data: { status: "success", rawData: paystackData as any },
    });

    res.json({ success: true, transactionId: reference });
  } catch (err: any) {
    console.error("Paystack verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

// --------------------- VIEW CUSTOMER PAYMENTS ---------------------
export const viewPayment = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const payments = await prisma.payment.findMany({
      where: { order: { customerId: userId } },
      include: { order: { select: { id: true, placedAt: true, status: true, totalAmount: true } } },
      orderBy: { paidAt: "desc" },
    });

    res.json(payments);
  } catch (err: any) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// --------------------- VIEW ALL PAYMENTS (ADMIN) ---------------------
export const viewAllPayments = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(403).json({ error: "Forbidden: Admins only" });

    const getUser = await prisma.user.findFirst({ where: { id: Number(user.id) } });
    if (!getUser || !getUser.role.toString().startsWith("ADMIN"))
      return res.status(403).json({ error: "Forbidden: Admins only" });

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

    res.json(payments);
  } catch (err: any) {
    console.error("Error fetching all payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};
