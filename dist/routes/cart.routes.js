"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cart_controller_1 = require("../controllers/cart.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.post("/", auth_controller_1.protect, cart_controller_1.addToCart);
router.get("/", auth_controller_1.protect, cart_controller_1.getAllCart);
router.get("/:cartid", auth_controller_1.protect, cart_controller_1.getItemCart);
router.get("/me/current", auth_controller_1.protect, cart_controller_1.getUserCart);
router.put("/update/:userId", auth_controller_1.protect, cart_controller_1.updateCartItem);
router.patch("/me/item/:itemId", auth_controller_1.protect, cart_controller_1.updateCartItemQty);
router.delete("/:cartId", auth_controller_1.protect, cart_controller_1.removeCartItem);
router.delete("/:userId", auth_controller_1.protect, cart_controller_1.clearCart);
exports.default = router;
