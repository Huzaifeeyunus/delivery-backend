import { Router } from "express";
import {
  createSize,
  getAllSize,
  findSize,
  updateSize,
  deleteSize,
} from "../controllers/size.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();


router.post("/", protect, createSize);       // Create product
router.get("/", getAllSize);                   // List all products
router.get("/:id", findSize);                // Update product
router.put("/:id", protect, updateSize);     // Update product
router.delete("/:id", protect, deleteSize);  // Delete product


export default router;
