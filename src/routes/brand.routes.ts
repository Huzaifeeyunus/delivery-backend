import { Router } from "express";
import {
  createBrand,
  getAllBrand,
  findBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();


router.post("/", protect, createBrand);       // Create product
router.get("/", getAllBrand);                   // List all products
router.get("/:id", findBrand);                // Update product
router.put("/:id", protect, updateBrand);     // Update product
router.delete("/:id", protect, deleteBrand);  // Delete product


export default router;
