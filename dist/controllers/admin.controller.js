"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLine = exports.getBar = exports.getStats = exports.getChartMetrics = exports.getAdminDashboardMetrics = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
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
            totalUsers,
            totalVendors,
            totalOrders,
            totalDeliveries,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
        });
    }
    catch (error) {
        console.error("Admin metrics error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAdminDashboardMetrics = getAdminDashboardMetrics;
const getChartMetrics = async (req, res) => {
    try {
        const monthlyOrders = await prisma_1.default.$queryRaw `
      SELECT MONTH(createdAt) AS month, COUNT(*) AS orderCount
      FROM \`Order\`
      GROUP BY month
      ORDER BY month;
    `;
        const monthlyRevenue = await prisma_1.default.$queryRaw `
      SELECT MONTH(createdAt) AS month, SUM(totalAmount) AS revenue
      FROM \`Order\`
      GROUP BY month
      ORDER BY month;
    `;
        res.json({ monthlyOrders, monthlyRevenue });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to load chart data." });
    }
};
exports.getChartMetrics = getChartMetrics;
const getStats = async (req, res) => {
    res.json({
        users: 120,
        vendors: 15,
        orders: 340,
        revenue: 10234.56,
    });
};
exports.getStats = getStats;
const getBar = async (req, res) => {
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
exports.getBar = getBar;
const getLine = async (req, res) => {
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
exports.getLine = getLine;
