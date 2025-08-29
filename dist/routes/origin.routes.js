"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const origin_controller_1 = require("../controllers/origin.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/", auth_controller_1.protect, origin_controller_1.createOrigin); // Create product
router.get("/", origin_controller_1.getAllOrigin); // List all products
router.get("/:id", origin_controller_1.findOrigin); // Update product
router.put("/:id", auth_controller_1.protect, origin_controller_1.updateOrigin); // Update product
router.delete("/:id", auth_controller_1.protect, origin_controller_1.deleteOrigin); // Delete product
exports.default = router;
