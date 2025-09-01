import { Router } from "express";
import {
  createRole,
  getAllRole,
  findRole,
  updateRole,
  deleteRole,
} from "../controllers/role.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();

router.post("/", protect, createRole);       // Create product
router.get("/", getAllRole);                 // List all products
router.get("/:id", findRole);                // Update product
router.put("/:id", protect, updateRole);     // Update product
router.delete("/:id", protect, deleteRole);  // Delete product

export default router;
 