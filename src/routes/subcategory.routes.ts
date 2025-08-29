import { Router } from "express";
import {
  createSubCategory,
  getAllsubCategory,
  findSubCategoryByCategory,
  findSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../controllers/productsubcategory.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();


router.post("/", protect, createSubCategory);       // Create product
router.get("/", getAllsubCategory);                 // List all products
router.get("/:categoryid", findSubCategoryByCategory);                // Update product
router.get("/:id", findSubCategory);                // Update product
router.put("/:id", protect, updateSubCategory);     // Update product
router.delete("/:id", protect, deleteSubCategory);  // Delete product


export default router;
