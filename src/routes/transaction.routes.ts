// src/routes/transactions.routes.ts
import express from "express"; 
import { protect } from "../controllers/auth.controller";
import { viewTransaction, viewAllTransactions, viewVendorTransactions } from "../controllers/transaction.controllers";
 
const router = express.Router();
 
router.get("/transaction/:customerId", protect, viewAllTransactions);
router.get("/transaction/customers/all", protect, viewAllTransactions);
router.get("/transaction/vendors", protect, viewVendorTransactions);

export default router;
