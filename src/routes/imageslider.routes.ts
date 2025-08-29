import { Router } from "express";
import {
  createImageSlider, 
  getImageSliders,
  findImageSlider, 
  updateImageSlider,  
  deleteImageSlider,
} from "../controllers/imageslider.controller";
import { protect } from "../controllers/auth.controller";
import { createUploader } from "../middlewares/upload.middleware";

  
const router = Router();

const uploader = createUploader();

 // router.post("/", protect, createImageSlider);   // Create product
router.post("/", protect, uploader.any(), createImageSlider); 
router.get("/", getImageSliders);                   // List all products
router.get("/:id", findImageSlider);                // List all products                // List all products
router.put("/:id", protect, updateImageSlider);     // Update product 
router.delete("/:id", protect, deleteImageSlider);  // Delete product

export default router;
