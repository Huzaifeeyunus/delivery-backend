"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const size_controller_1 = require("../controllers/size.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/", auth_controller_1.protect, size_controller_1.createSize); // Create product
router.get("/", size_controller_1.getAllSize); // List all products
router.get("/:id", size_controller_1.findSize); // Update product
router.put("/:id", auth_controller_1.protect, size_controller_1.updateSize); // Update product
router.delete("/:id", auth_controller_1.protect, size_controller_1.deleteSize); // Delete product
exports.default = router;
