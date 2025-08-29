"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vender_controller_1 = require("../controllers/vender.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
const uploader = (0, upload_middleware_1.createUploader)();
router.post("/", auth_controller_1.protect, uploader.any(), vender_controller_1.createVendor); // Create product
router.get("/", auth_controller_1.protect, vender_controller_1.getAllVendor); // List all products
router.get("/:id", auth_controller_1.protect, vender_controller_1.findVendor); // Update product
router.put("/:id", auth_controller_1.protect, uploader.any(), vender_controller_1.updateVendor); // Update product
router.delete("/:id", auth_controller_1.protect, vender_controller_1.deleteVendor); // Delete product
exports.default = router;
