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
  updateProductImages,
  updateProductVideos,
  updateProductWithVariantsAndImages,
  deleteProduct,
  deleteProductVariant,
  deleteProductVariantSize,
  // ✅ if we create deleteProductVariantWithSizes, import it here
} from "../controllers/product.controller";
import { protect } from "../controllers/auth.controller";
import { createUploader } from "../middlewares/upload.middleware";

const router = Router();
const uploader = createUploader();

// ✅ Product creation
router.post("/", protect, createProduct);
router.post("/with-image", protect, uploader.any(), createProductWithImage);

// ✅ Product fetching
router.get("/", getProducts);
router.get("/:id", findProduct);
router.get("/category/:id", findProductByCategory);
router.get("/subcategory/:id", findProductBySubCategory);
router.get("/images/:id", findProductImage);

// ✅ Product updating
router.put("/:id", protect, updateProduct);
router.put("/with-variants-image/:id", protect, uploader.any(), updateProductWithVariantsAndImages);
router.put("/image/:id", protect, uploader.any(), updateProductImages);
router.put("/video/:id", protect, uploader.any(), updateProductVideos);

// ✅ Product deletion
router.delete("/product/:id", protect, deleteProduct);
router.delete("/variant/:id", protect, deleteProductVariant);
router.delete("/variant-size/:id", protect, deleteProductVariantSize);

// ✅ If you want a dedicated route for deleting a variant + all sizes/images
// router.delete("/variant-with-sizes/:id", protect, deleteProductVariantWithSizes);

export default router;
 