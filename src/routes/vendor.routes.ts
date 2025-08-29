import { Router } from "express";
import {
  createVendor,
  getAllVendor,
  findVendor,
  updateVendor,
  deleteVendor,
} from "../controllers/vender.controller";
import { protect } from "../controllers/auth.controller"; 
import { createUploader } from "../middlewares/upload.middleware";

const router = Router();
const uploader = createUploader();

router.post("/", protect, uploader.any(), createVendor);       // Create product
router.get("/", protect, getAllVendor);                   // List all products
router.get("/:id", protect, findVendor);                // Update product
router.put("/:id", protect, uploader.any(), updateVendor);     // Update product
router.delete("/:id", protect, deleteVendor);  // Delete product


export default router;
