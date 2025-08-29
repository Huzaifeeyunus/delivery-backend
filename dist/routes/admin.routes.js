"use strict";
// backend/src/routes/admin.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.get("/dashboard/metrics", auth_controller_1.protect, admin_controller_1.getAdminDashboardMetrics);
router.get("/dashboard/charts", auth_controller_1.protect, admin_controller_1.getChartMetrics);
router.get("/dashboard/stats", auth_controller_1.protect, admin_controller_1.getStats);
router.get("/dashboard/bar", auth_controller_1.protect, admin_controller_1.getBar);
router.get("/dashboard/line", auth_controller_1.protect, admin_controller_1.getLine);
exports.default = router;
