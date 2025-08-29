import { Router } from "express";
import {
  createOrigin,
  getAllOrigin,
  findOrigin,
  updateOrigin,
  deleteOrigin,
} from "../controllers/origin.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();

router.post("/", protect, createOrigin);       // Create product
router.get("/", getAllOrigin);                 // List all products
router.get("/:id", findOrigin);                // Update product
router.put("/:id", protect, updateOrigin);     // Update product
router.delete("/:id", protect, deleteOrigin);  // Delete product

export default router;
 