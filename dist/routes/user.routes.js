"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
const uploader = (0, upload_middleware_1.createUploader)();
router.post("/", auth_controller_1.protect, uploader.none(), user_controller_1.createUser); // Create product
router.get("/", auth_controller_1.protect, user_controller_1.getAllUser); // List all products
router.get("/:id", auth_controller_1.protect, user_controller_1.findUser); // Update product
router.put("/:id", auth_controller_1.protect, uploader.none(), user_controller_1.updateUser); // Update product
router.delete("/:id", auth_controller_1.protect, user_controller_1.deleteUser); // Delete product
exports.default = router;
