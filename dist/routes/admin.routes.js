"use strict";
// backend/src/routes/admin.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const order_controller_1 = require("../controllers/order.controller");
const vender_controller_1 = require("../controllers/vender.controller");
const user_controller_1 = require("../controllers/user.controller");
const transaction_controllers_1 = require("../controllers/transaction.controllers");
const router = express_1.default.Router();
router.get("/dashboard/metrics", auth_controller_1.protect, admin_controller_1.getAdminDashboardMetrics);
router.get("/dashboard/charts", auth_controller_1.protect, admin_controller_1.getChartMetrics);
router.get("/dashboard/stats", auth_controller_1.protect, admin_controller_1.getStats);
router.get("/dashboard/bar", auth_controller_1.protect, admin_controller_1.getBar);
router.get("/dashboard/line", auth_controller_1.protect, admin_controller_1.getLine);
router.get("/dashboard/users", auth_controller_1.protect, user_controller_1.getAllUser); //-> returns list of users
router.get("/dashboard/vendors", auth_controller_1.protect, vender_controller_1.getAllVendor); //-> returns list of vendors
router.get("/dashboard/orders", auth_controller_1.protect, order_controller_1.getAllOrders); //-> returns list of orders
router.get("/dashboard/revenue", auth_controller_1.protect, transaction_controllers_1.viewAllTransactions); //-> returns list of payments with totalAmount
exports.default = router;
