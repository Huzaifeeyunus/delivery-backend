// src/routes/payments.routes.ts
import express from "express"; 
import { protect } from "../controllers/auth.controller";
import { initiatePayment, verifyPayment, viewPayment, viewAllPayments } from "../controllers/payment.controller";

const router = express.Router();

router.post("/initiate", protect, initiatePayment);
router.get("/verify", protect, verifyPayment);
router.get("/payment/:customerId", protect, viewPayment);
router.get("/payment/customers/all", protect, viewAllPayments);

export default router;
