import { Router } from "express";
import {
  createCategory,
  getAllCategory,
  findcategory,
  updatecategory,
  deletecategory,
} from "../controllers/productcategory.controller";
import { protect } from "../controllers/auth.controller";

const  router = Router();


router.post("/", protect, createCategory);       // Create product
router.get("/", getAllCategory);                   // List all products
router.get("/:id", findcategory);                // Update product
router.put("/:id", protect, updatecategory);     // Update product
router.delete("/:id", protect, deletecategory);  // Delete product


export default router;
