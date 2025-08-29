"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productsubcategory_controller_1 = require("../controllers/productsubcategory.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/", auth_controller_1.protect, productsubcategory_controller_1.createSubCategory); // Create product
router.get("/", productsubcategory_controller_1.getAllsubCategory); // List all products
router.get("/:categoryid", productsubcategory_controller_1.findSubCategoryByCategory); // Update product
router.get("/:id", productsubcategory_controller_1.findSubCategory); // Update product
router.put("/:id", auth_controller_1.protect, productsubcategory_controller_1.updateSubCategory); // Update product
router.delete("/:id", auth_controller_1.protect, productsubcategory_controller_1.deleteSubCategory); // Delete product
exports.default = router;
