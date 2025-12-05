import express from "express";
import { 
  getCustomerProfile,
  getActiveOrdersCount,
  getCartItemsCount,
  getTotalSpending,
  getCustomerWishlist,
  getCustomerReviews,
  getOrderHistory,
  getCustomerNotifications,
  getCustomerSupportTickets
} from "../controllers/customer.controller";
import { protect } from "../controllers/auth.controller";

const router = express.Router();

// Customer profile and stats
router.get("/profile", protect, getCustomerProfile);
router.get("/orders/active", protect, getActiveOrdersCount);
router.get("/cart/count", protect, getCartItemsCount);
router.get("/spending/total", protect, getTotalSpending);

// Additional routes for CustomerLayout features
router.get("/wishlist", protect, getCustomerWishlist);
router.get("/reviews", protect, getCustomerReviews);
router.get("/history", protect, getOrderHistory);
router.get("/notifications", protect, getCustomerNotifications);
router.get("/support", protect, getCustomerSupportTickets);

export default router;