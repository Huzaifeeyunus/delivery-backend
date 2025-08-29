// backend/src/routes/admin.routes.ts

import express from "express";
import { getAdminDashboardMetrics, getChartMetrics, getStats, getBar, getLine } from "../controllers/admin.controller";
import {protect} from "../controllers/auth.controller"
const router = express.Router();

router.get("/dashboard/metrics", protect, getAdminDashboardMetrics);
router.get("/dashboard/charts", protect, getChartMetrics);
router.get("/dashboard/stats", protect, getStats);
router.get("/dashboard/bar", protect, getBar);
router.get("/dashboard/line", protect, getLine);

export default router;
 