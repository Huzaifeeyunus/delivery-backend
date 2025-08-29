// src/routes/auth.routes.ts
import express from "express";
import { register , login, logout, protect} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware"; // verifies token

const router = express.Router();

router.post("/register", register);
router.post("/login", login); // ✅ Add this 
// router.post("/logout", protect, logout); // Protected logout 
router.post("/logout", protect, logout);
export default router;
