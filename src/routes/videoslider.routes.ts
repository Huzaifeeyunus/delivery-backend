import { Router } from "express";
import {
  createVideoSlider, 
  getVideoSliders,
  findVideoSlider, 
  updateVideoSlider,  
  deleteVideoSlider,
} from "../controllers/videoslider.controller";
import { protect } from "../controllers/auth.controller";
import { createUploader } from "../middlewares/upload.middleware";

  
const router = Router();

const uploader = createUploader();

 // router.post("/", protect, createVideoSlider);   // Create product
router.post("/", protect, uploader.any(), createVideoSlider); 
router.get("/", getVideoSliders);                   // List all products
router.get("/:id", findVideoSlider);                // List all products                // List all products
router.put("/:id", protect, updateVideoSlider);     // Update product 
router.delete("/:id", protect, deleteVideoSlider);  // Delete product

export default router;
