// src/controllers/payments.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import prisma from "../lib/prisma";
import { User } from "@prisma/client";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required" });
    }

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack expects kobo (i.e. GHS * 100)
        currency: "GHS",
        callback_url: `${process.env.VITE_BASE_URL ?? "http://localhost:5173"}/customer/checkout`, // 👈 redirect back here
        //callback_url: `${process.env.VITE_BASE_URL ?? "http://localhost:5173"}/customer/checkout`, // 👈 redirect back here
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, reference } = paystackRes.data.data;

    // Create transaction in DB (without orderId yet)
    await prisma.transaction.create({
      data: {
        reference,
        method: "Paystack",
        amount,
        status: "initiated",
        rawData: paystackRes.data,
        // orderId will be linked later when order is created
      },
    });


    res.json({
      authorizationUrl: authorization_url,
      transactionId: reference, // use this later for order confirmation
    });
  } catch (err: any) {
    console.error("Paystack init error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};


// src/controllers/payments.controller.ts 
// 2.2 Verify Payment
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    let reference = req.query.reference || "";

    if (!reference) return res.status(400).json({ error: "Reference is required" });

    // Convert reference to string if it came as array
    if (Array.isArray(reference)) reference = reference[0];
    reference = reference.toString();

    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    if (verifyRes.data.data.status !== "success")
      return res.status(400).json({ success: false, error: "Payment failed" });


    //look for transaction
    const transactionRecord = await prisma.transaction.findFirst({
      where: { reference },
    });
    if (!transactionRecord) return res.status(404).json({ error: "Transaction not found" });

    // Update transaction status  
    await prisma.transaction.update({
      where: { id: transactionRecord.id }, // ✅ now TypeScript is happy
      data: { status: "success", rawData: verifyRes.data },
    });

    res.json({ success: true, transactionId: reference });
  } catch (err: any) {
    console.error("Paystack verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment verification failed" });
  }
};


export const ViewPayment = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const payments = await prisma.payment.findMany({
      where: {
        order: {
          customerId: userId, // only payments for this user's orders
        },
      },
      include: {
        order: {
          select: {
            id: true,
            placedAt: true,
            status: true,
            totalAmount: true,
          },
        },
      },
      orderBy: {
        paidAt: "desc", // newest first
      },
    });

    res.json(payments);
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};


// GET /admin/payments
export const ViewAllPayments = async (req: Request, res: Response) => {
  try {
    const user = req.user || ""; // make sure your JWT/middleware attaches role
    if (!user) {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    const getUser = await prisma.user.findFirst({where: {id: Number(user.id)}});
    if (!getUser) {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }


    const userRole = getUser.role;
    if (!userRole.toString().startsWith("ADMIN")) {
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
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    res.json(payments);
  } catch (err) {
    console.error("Error fetching all payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};