"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brand_controller_1 = require("../controllers/brand.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/", auth_controller_1.protect, brand_controller_1.createBrand); // Create product
router.get("/", brand_controller_1.getAllBrand); // List all products
router.get("/:id", brand_controller_1.findBrand); // Update product
router.put("/:id", auth_controller_1.protect, brand_controller_1.updateBrand); // Update product
router.delete("/:id", auth_controller_1.protect, brand_controller_1.deleteBrand); // Delete product
exports.default = router;
