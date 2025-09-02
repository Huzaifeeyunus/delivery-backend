// backend/src/routes/admin.routes.ts

import express from "express";
import { getAdminDashboardMetrics, getChartMetrics, getStats, getBar, getLine } from "../controllers/admin.controller";
import {protect} from "../controllers/auth.controller"
import { getAllOrders } from "../controllers/order.controller";
import { getAllVendor } from "../controllers/vender.controller";
import { getAllUser } from "../controllers/user.controller"; 
import { viewAllTransactions } from "../controllers/transaction.controllers";
const router = express.Router();

router.get("/dashboard/metrics", protect, getAdminDashboardMetrics);
router.get("/dashboard/charts", protect, getChartMetrics);
router.get("/dashboard/stats", protect, getStats);
router.get("/dashboard/bar", protect, getBar);
router.get("/dashboard/line", protect, getLine);


router.get("/dashboard/users", protect, getAllUser);    //-> returns list of users
router.get("/dashboard/vendors", protect, getAllVendor);  //-> returns list of vendors
router.get("/dashboard/orders", protect, getAllOrders);   //-> returns list of orders
router.get("/dashboard/revenue", protect, viewAllTransactions);  //-> returns list of payments with totalAmount

export default router;
 