// src/controllers/transactions.controller.ts
import { Request, Response } from "express"; 
import prisma from "../lib/prisma";
 
 
// --------------------- VIEW CUSTOMER PAYMENTS ---------------------
export const viewTransaction = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const transactions = await prisma.transaction.findMany({
      where: { order: { customerId: userId } },
      include: { order: { select: { id: true, placedAt: true, status: true, totalAmount: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (err: any) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// --------------------- VIEW ALL PAYMENTS (ADMIN) ---------------------
export const viewAllTransactions = async (req: Request, res: Response) => {
  try { 

    const { status, customerId, fromDate, toDate } = req.query;

    const transactions = await prisma.transaction.findMany({ 
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
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (err: any) {
    console.error("Error fetching all transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};


export const viewVendorTransactions = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(403).json({ error: "Forbidden: Admins only" });

    const getUser = await prisma.user.findFirst({ where: { id: Number(user.id) } });
    if (!getUser || !getUser.role?.toString().startsWith("ADMIN"))
      return res.status(403).json({ error: "Forbidden: Admins only" });

    const { status, customerId, fromDate, toDate } = req.query;

    const transactions = await prisma.transaction.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (err: any) {
    console.error("Error fetching all transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
