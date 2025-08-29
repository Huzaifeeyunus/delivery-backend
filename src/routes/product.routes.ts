import { Router } from "express";
import {
  createProduct,
  createProductWithImage,
  getProducts,
  findProduct,
  findProductByCategory,
  findProductBySubCategory,
  findProductImage,
  updateProduct,
  updateProductImage,
  updateProductVideo,
  updateProductWithImage,
  deleteProduct,
} from "../controllers/product.controller";
import { protect } from "../controllers/auth.controller";
import { createUploader } from "../middlewares/upload.middleware";

   
const router = Router();

const uploader = createUploader();

 // router.post("/", protect, createProduct);       // Create product
router.post("/", protect, createProduct);
router.post("/with-image", protect, 
uploader.any(), createProductWithImage);
router.get("/", getProducts);                   // List all products
router.get("/:id", findProduct);                // List all products                // List all products
router.get("/category/:id", findProductByCategory);                // List all products
router.get("/subcategory/:id", findProductBySubCategory);                // UList all products
router.get("/images/:id", findProductImage);                // Update product
router.put("/:id", protect, updateProduct);     // Update product
router.put("/with-image/:id", protect, uploader.any(), updateProductWithImage);     // Update product
router.put("/image/:id", protect, uploader.any(), updateProductImage);     // Update product
router.put("/video/:id", protect, uploader.any(), updateProductVideo);     // Update product
router.delete("/:id", protect, deleteProduct);  // Delete product

export default router;
