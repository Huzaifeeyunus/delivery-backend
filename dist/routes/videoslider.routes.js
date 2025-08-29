"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoslider_controller_1 = require("../controllers/videoslider.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
const uploader = (0, upload_middleware_1.createUploader)();
// router.post("/", protect, createVideoSlider);   // Create product
router.post("/", auth_controller_1.protect, uploader.any(), videoslider_controller_1.createVideoSlider);
router.get("/", videoslider_controller_1.getVideoSliders); // List all products
router.get("/:id", videoslider_controller_1.findVideoSlider); // List all products                // List all products
router.put("/:id", auth_controller_1.protect, videoslider_controller_1.updateVideoSlider); // Update product 
router.delete("/:id", auth_controller_1.protect, videoslider_controller_1.deleteVideoSlider); // Delete product
exports.default = router;
