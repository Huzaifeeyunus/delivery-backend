// backend/src/controllers/admin.controller.ts
 import { Request, Response } from "express";
import prisma from "../lib/prisma"; 

  
export const getAdminDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalVendors = await prisma.vendor.count();
    const totalOrders = await prisma.order.count();
    const totalDeliveries = await prisma.order.count({
      where: { deliveryStatus: "delivered" },
    });
    const totalRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
    });

    return res.json({
      totalUsers,
      totalVendors,
      totalOrders,
      totalDeliveries,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};




export const getChartMetrics = async (req: Request, res: Response) => {
  try {
    const monthlyOrders = await prisma.$queryRaw`
      SELECT MONTH(createdAt) AS month, COUNT(*) AS orderCount
      FROM \`Order\`
      GROUP BY month
      ORDER BY month;
    `;

    const monthlyRevenue = await prisma.$queryRaw`
      SELECT MONTH(createdAt) AS month, SUM(totalAmount) AS revenue
      FROM \`Order\`
      GROUP BY month
      ORDER BY month;
    `;

    res.json({ monthlyOrders, monthlyRevenue });
  } catch (error) {
    res.status(500).json({ error: "Failed to load chart data." });
  }
};




export const getStats = async (req: Request, res: Response) => {
   res.json({
    users: 120,
    vendors: 15,
    orders: 340,
    revenue: 10234.56,
  });
};


 
export const getBar = async (req: Request, res: Response) => {
  res.json({
    labels: ['Food', 'Drinks', 'Clothing', 'Electronics'],
    datasets: [
      {
        label: 'Orders',
        data: [120, 90, 45, 65],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  });
};


export const getLine = async (req: Request, res: Response) => {
  res.json({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Revenue',
        data: [500, 800, 600, 900, 750],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
    ],
  });
};