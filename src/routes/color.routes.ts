import { Router } from "express";
import {
  createColor,
  getAllColor,
  findColor,
  updateColor,
  deleteColor,
} from "../controllers/color.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();


router.post("/", protect, createColor);       // Create product
router.get("/", getAllColor);                   // List all products
router.get("/:id", findColor);                // Update product
router.put("/:id", protect, updateColor);     // Update product
router.delete("/:id", protect, deleteColor);  // Delete product


export default router;
