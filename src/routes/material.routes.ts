import { Router } from "express";
import {
  createMaterial,
  getAllMaterial,
  findMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controllers/material.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();


router.post("/", protect, createMaterial);       // Create product
router.get("/", getAllMaterial);                   // List all products
router.get("/:id", findMaterial);                // Update product
router.put("/:id", protect, updateMaterial);     // Update product
router.delete("/:id", protect, deleteMaterial);  // Delete product


export default router;
