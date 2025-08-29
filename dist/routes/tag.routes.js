"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tag_controller_1 = require("../controllers/tag.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/", auth_controller_1.protect, tag_controller_1.createTag); // Create product
router.get("/", tag_controller_1.getAllTag); // List all products
router.get("/:id", tag_controller_1.findTag); // Update product
router.put("/:id", auth_controller_1.protect, tag_controller_1.updateTag); // Update product
router.delete("/:id", auth_controller_1.protect, tag_controller_1.deleteTag); // Delete product
exports.default = router;
