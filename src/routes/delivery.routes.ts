import { Router } from "express";
import { updateDeliveryStatus } from "../controllers/delivery.controller";

const router = Router();

router.patch("/:deliveryId", updateDeliveryStatus);

export default router;
