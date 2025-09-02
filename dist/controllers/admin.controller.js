"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLine = exports.getBar = exports.getStats = exports.getChartMetrics = exports.getAdminDashboardMetrics = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ============================
// DASHBOARD METRICS
// ============================
const getAdminDashboardMetrics = async (req, res) => {
    try {
        const totalUsers = await prisma_1.default.user.count();
        const totalVendors = await prisma_1.default.vendor.count();
        const totalOrders = await prisma_1.default.order.count();
        const totalDeliveries = await prisma_1.default.order.count({
            where: { deliveryStatus: "delivered" },
        });
        const totalRevenue = await prisma_1.default.order.aggregate({
            _sum: { totalAmount: true },
        });
        return res.json({
            users: totalUsers,
            vendors: totalVendors,
            orders: totalOrders,
            deliveries: totalDeliveries,
            revenue: totalRevenue._sum.totalAmount || 0,
        });
    }
    catch (error) {
        console.error("Dashboard metrics error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAdminDashboardMetrics = getAdminDashboardMetrics;
// ============================
// CHART DATA
// ============================
const getChartMetrics = async (req, res) => {
    try {
        // Orders by category
        const categoryData = await prisma_1.default.$queryRaw `
      SELECT c.name AS category, COUNT(o.id) AS total
      FROM \`Order\` o
      JOIN \`Product\` p ON o.id = p.id
      JOIN \`Category\` c ON p.categoryId = c.id
      GROUP BY c.name
    `;
        // Monthly revenue
        const monthlyRevenue = await prisma_1.default.$queryRaw `
      SELECT MONTH(createdAt) AS month, SUM(totalAmount) AS revenue
      FROM \`Order\`
      GROUP BY month
      ORDER BY month
    `;
        res.json({
            categoryData,
            monthlyRevenue,
        });
    }
    catch (error) {
        console.error("Chart data error:", error);
        res.status(500).json({ error: "Failed to fetch chart data." });
    }
};
exports.getChartMetrics = getChartMetrics;
// ============================
// LIVE STATS
// ============================
const getStats = async (req, res) => {
    try {
        const users = await prisma_1.default.user.count();
        const vendors = await prisma_1.default.vendor.count();
        const orders = await prisma_1.default.order.count();
        const revenueAgg = await prisma_1.default.order.aggregate({ _sum: { totalAmount: true } });
        const revenue = revenueAgg._sum.totalAmount || 0;
        res.json({ users, vendors, orders, revenue });
    }
    catch (error) {
        console.error("Failed to fetch stats:", error);
        res.status(500).json({ error: "Failed to fetch stats." });
    }
};
exports.getStats = getStats;
// ============================
// BAR CHART: Orders by Category
// ============================
// Admin Controller: getBar
const getBar = async (req, res) => {
    try {
        // Count orders per product category
        const rawData = await prisma_1.default.$queryRaw `
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
    }
    catch (error) {
        console.error("Failed to fetch bar chart data:", error);
        res.status(500).json({ error: "Failed to fetch bar chart data." });
    }
};
exports.getBar = getBar;
// Admin Controller: getLine
const getLine = async (req, res) => {
    try {
        // Revenue per month
        const rawData = await prisma_1.default.$queryRaw `
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
    }
    catch (error) {
        console.error("Failed to fetch line chart data:", error);
        res.status(500).json({ error: "Failed to fetch line chart data." });
    }
};
exports.getLine = getLine;
