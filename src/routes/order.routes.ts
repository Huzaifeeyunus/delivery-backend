import express from "express";
import { 
        initiatePayment, 
        placeOrder,
        getAllOrders,
        getUserOrders,
        getVendorOrders,
        updateOrderStatus, 
        getOrderDetails,
        getCustomerOrders,updateDeliveryStatus,updatePaymentStatus,
        markOrderAsPaid, handlePaymentFailure, refundOrder } 
        from "../controllers/order.controller";   
import { protect } from "../controllers/auth.controller";
 
const router = express.Router();
  
router.get("/", getAllOrders); 
router.get("/:orderId", getOrderDetails); 
router.get("/all/admins/admin", getAllOrders); 
router.get("/user/:userId", getUserOrders);
router.get("/me/current/customer/:userId", getCustomerOrders);
router.get("/vendors/vendor/:vendorId", getVendorOrders);

router.post("/payments/pay/initiate",  protect, initiatePayment);
router.post("/placeOrder",  protect, placeOrder);
router.post("/", protect, placeOrder);
router.patch("/:orderId/status", protect, updateOrderStatus);
router.post("/order/:orderId/pay", protect, markOrderAsPaid);
router.post("/:orderId/payment-failed", protect, handlePaymentFailure);
router.post("/:orderId/refund", protect, refundOrder); 

router.patch("/order/d-s/:orderId/delivery-status", protect, updateDeliveryStatus); 
router.patch("/order/:orderId/payment-status", protect, updatePaymentStatus);

 
export default router; 
