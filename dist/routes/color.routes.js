"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const color_controller_1 = require("../controllers/color.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/", auth_controller_1.protect, color_controller_1.createColor); // Create product
router.get("/", color_controller_1.getAllColor); // List all products
router.get("/:id", color_controller_1.findColor); // Update product
router.put("/:id", auth_controller_1.protect, color_controller_1.updateColor); // Update product
router.delete("/:id", auth_controller_1.protect, color_controller_1.deleteColor); // Delete product
exports.default = router;
