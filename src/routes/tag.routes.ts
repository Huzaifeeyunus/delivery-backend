import { Router } from "express";
import {
  createTag,
  getAllTag,
  findTag,
  updateTag,
  deleteTag,
} from "../controllers/tag.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();


router.post("/", protect, createTag);       // Create product
router.get("/", getAllTag);                   // List all products
router.get("/:id", findTag);                // Update product
router.put("/:id", protect, updateTag);     // Update product
router.delete("/:id", protect, deleteTag);  // Delete product


export default router;
