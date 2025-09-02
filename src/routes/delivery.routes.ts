import { Router } from "express";
import { createDelivery, getAllDeliveries, getDeliveryById, updateDelivery, updateDeliveryStatus, deleteDelivery } from "../controllers/delivery.controller";

const router = Router();

router.post("/", createDelivery);
router.get("/", getAllDeliveries);
router.get("/:id", getDeliveryById);
router.put("/:id", updateDelivery); 
router.patch("/:deliveryId", updateDeliveryStatus);
router.delete("/:id", deleteDelivery);

export default router;
