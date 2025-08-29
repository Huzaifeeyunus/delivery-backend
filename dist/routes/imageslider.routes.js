"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imageslider_controller_1 = require("../controllers/imageslider.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
const uploader = (0, upload_middleware_1.createUploader)();
// router.post("/", protect, createImageSlider);   // Create product
router.post("/", auth_controller_1.protect, uploader.any(), imageslider_controller_1.createImageSlider);
router.get("/", imageslider_controller_1.getImageSliders); // List all products
router.get("/:id", imageslider_controller_1.findImageSlider); // List all products                // List all products
router.put("/:id", auth_controller_1.protect, imageslider_controller_1.updateImageSlider); // Update product 
router.delete("/:id", auth_controller_1.protect, imageslider_controller_1.deleteImageSlider); // Delete product
exports.default = router;
