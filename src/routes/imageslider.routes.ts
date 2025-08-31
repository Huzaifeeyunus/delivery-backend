import { Router } from "express";
import {
  createImageSlider, 
  getAllImageSlider,
  getImageSliderByCategory,
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
router.get("/", getAllImageSlider);                   // List all products
router.get("/slider/category", getImageSliderByCategory);                   // List category products
router.get("/:id", findImageSlider);                // List all products                // List all products
router.put("/:id", protect,  uploader.any(), updateImageSlider);     // Update product 
router.delete("/:id", protect, deleteImageSlider);  // Delete product

export default router;
