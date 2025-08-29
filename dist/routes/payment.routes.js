"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/payments.routes.ts
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const payment_controller_1 = require("../controllers/payment.controller");
const router = express_1.default.Router();
router.post("/initiate", auth_controller_1.protect, payment_controller_1.initiatePayment);
router.get("/verify", auth_controller_1.protect, payment_controller_1.verifyPayment);
router.get("/payment/:customerId", auth_controller_1.protect, payment_controller_1.viewPayment);
router.get("/payment/customers/all", auth_controller_1.protect, payment_controller_1.viewAllPayments);
exports.default = router;
