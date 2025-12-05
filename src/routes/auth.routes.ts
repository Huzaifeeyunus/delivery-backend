// src/routes/auth.routes.ts
import express from "express";
import { register , login, logout, protect, sendVerificationCode, verifyCodeAndLogin, verifyAndRegister} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware"; // verifies token

const router = express.Router();

router.post("/register", register);
router.post("/login", login); // ✅ Add this 
// router.post("/logout", protect, logout); // Protected logout 
router.post("/logout", protect, logout);

router.post("/verify-and-register", verifyAndRegister);

router.post("/send-verification", sendVerificationCode);
router.post("/verify-phone-login", verifyCodeAndLogin);
export default router;
