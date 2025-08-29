"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
const uploader = (0, upload_middleware_1.createUploader)();
// router.post("/", protect, createProduct);       // Create product
router.post("/", auth_controller_1.protect, product_controller_1.createProduct);
router.post("/with-image", auth_controller_1.protect, uploader.any(), product_controller_1.createProductWithImage);
router.get("/", product_controller_1.getProducts); // List all products
router.get("/:id", product_controller_1.findProduct); // List all products                // List all products
router.get("/category/:id", product_controller_1.findProductByCategory); // List all products
router.get("/subcategory/:id", product_controller_1.findProductBySubCategory); // UList all products
router.get("/images/:id", product_controller_1.findProductImage); // Update product
router.put("/:id", auth_controller_1.protect, product_controller_1.updateProduct); // Update product
router.put("/with-image/:id", auth_controller_1.protect, uploader.any(), product_controller_1.updateProductWithImage); // Update product
router.put("/image/:id", auth_controller_1.protect, uploader.any(), product_controller_1.updateProductImage); // Update product
router.put("/video/:id", auth_controller_1.protect, uploader.any(), product_controller_1.updateProductVideo); // Update product
router.delete("/:id", auth_controller_1.protect, product_controller_1.deleteProduct); // Delete product
exports.default = router;
