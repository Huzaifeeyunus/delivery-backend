"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const material_controller_1 = require("../controllers/material.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/", auth_controller_1.protect, material_controller_1.createMaterial); // Create product
router.get("/", material_controller_1.getAllMaterial); // List all products
router.get("/:id", material_controller_1.findMaterial); // Update product
router.put("/:id", auth_controller_1.protect, material_controller_1.updateMaterial); // Update product
router.delete("/:id", auth_controller_1.protect, material_controller_1.deleteMaterial); // Delete product
exports.default = router;
