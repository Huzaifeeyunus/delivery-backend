// src/routes/payments.routes.ts
import express from "express"; 
import { protect } from "../controllers/auth.controller";
import { initiatePayment, verifyPayment, ViewPayment, ViewAllPayments } from "../controllers/payment.controller";

const router = express.Router();

router.post("/initiate", protect, initiatePayment);
router.get("/verify", protect, verifyPayment);
router.get("/payment/:customerId", protect, ViewPayment);
router.get("/payment/customers/all", protect, ViewAllPayments);

export default router;
