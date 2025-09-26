import express from "express";
import {
  addToCart,
  getAllCart,
  getItemCart,
  getUserCart,
  updateCartItem,
  updateCartItemQty,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller";
import { protect } from "../controllers/auth.controller";
import { log } from "console";
 
const router = express.Router();
router.post("/", protect, addToCart); 
router.get("/", protect, getAllCart);
router.get("/:cartid", protect, getItemCart);
router.get("/me/current", protect, getUserCart);

router.put("/update/:userId", protect, updateCartItem);
router.patch("/me/item/:itemId", protect, updateCartItemQty);

router.delete("/:cartId", protect, removeCartItem);
router.delete("/:userId", protect, clearCart);

export default router;
   