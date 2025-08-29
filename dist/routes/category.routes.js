"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productcategory_controller_1 = require("../controllers/productcategory.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/", auth_controller_1.protect, productcategory_controller_1.createCategory); // Create product
router.get("/", productcategory_controller_1.getAllCategory); // List all products
router.get("/:id", productcategory_controller_1.findcategory); // Update product
router.put("/:id", auth_controller_1.protect, productcategory_controller_1.updatecategory); // Update product
router.delete("/:id", auth_controller_1.protect, productcategory_controller_1.deletecategory); // Delete product
exports.default = router;
