// backend/src/controllers/admin.controller.ts
 import { Request, Response } from "express";
import prisma from "../lib/prisma"; 
 

// ============================
// DASHBOARD METRICS
// ============================
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
      users: totalUsers,
      vendors: totalVendors,
      orders: totalOrders,
      deliveries: totalDeliveries,
      revenue: totalRevenue._sum.totalAmount || 0,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ============================
// CHART DATA
// ============================
export const getChartMetrics = async (req: Request, res: Response) => {
  try {
    // Orders by category
    const categoryData = await prisma.$queryRaw`
      SELECT c.name AS category, COUNT(o.id) AS total
      FROM \`Order\` o
      JOIN \`Product\` p ON o.id = p.id
      JOIN \`Category\` c ON p.categoryId = c.id
      GROUP BY c.name
    `;

    // Monthly revenue
    const monthlyRevenue = await prisma.$queryRaw`
      SELECT MONTH(createdAt) AS month, SUM(totalAmount) AS revenue
      FROM \`Order\`
      GROUP BY month
      ORDER BY month
    `;

    res.json({
      categoryData,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Chart data error:", error);
    res.status(500).json({ error: "Failed to fetch chart data." });
  }
};


 
// ============================
// LIVE STATS
// ============================
export const getStats = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.count();
    const vendors = await prisma.vendor.count();
    const orders = await prisma.order.count();
    const revenueAgg = await prisma.order.aggregate({ _sum: { totalAmount: true } });
    const revenue = revenueAgg._sum.totalAmount || 0;

    res.json({ users, vendors, orders, revenue });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
};

// ============================
// BAR CHART: Orders by Category
// ============================
// Admin Controller: getBar
export const getBar = async (req: Request, res: Response) => {
  try {
    // Count orders per product category
    const rawData: { categoryName: string; orderCount: bigint }[] = await prisma.$queryRaw`
      SELECT c.name AS categoryName, COUNT(oi.id) AS orderCount
      FROM \`OrderItem\` oi
      INNER JOIN \`Product\` p ON p.id = oi.productId
      INNER JOIN \`Category\` c ON c.id = p.categoryId
      GROUP BY c.name
      ORDER BY c.name;
    `;

    const labels = rawData.map(r => r.categoryName);
    const data = rawData.map(r => Number(r.orderCount));

    res.json({
      labels,
      datasets: [
        {
          label: 'Orders',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        },
      ],
    });
  } catch (error) {
    console.error("Failed to fetch bar chart data:", error);
    res.status(500).json({ error: "Failed to fetch bar chart data." });
  }
};

// Admin Controller: getLine
export const getLine = async (req: Request, res: Response) => {
  try {
    // Revenue per month
    const rawData: { month: number; revenue: number }[] = await prisma.$queryRaw`
      SELECT MONTH(o.createdAt) AS month, SUM(o.totalAmount) AS revenue
      FROM \`Order\` o
      GROUP BY month
      ORDER BY month;
    `;

    const labels = rawData.map(r => `Month ${r.month}`);
    const data = rawData.map(r => Number(r.revenue));

    res.json({
      labels,
      datasets: [
        {
          label: 'Revenue',
          data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
        },
      ],
    });
  } catch (error) {
    console.error("Failed to fetch line chart data:", error);
    res.status(500).json({ error: "Failed to fetch line chart data." });
  }
};


