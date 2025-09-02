import express from "express";
import {
  createDeliveryAgent,
  getAllDeliveryAgents,
  getDeliveryAgentById,
  updateDeliveryAgent,
  deleteDeliveryAgent,
  toggleVerification,
} from "../controllers/deliveryAgent.controller";

const router = express.Router();

router.post("/", createDeliveryAgent);
router.get("/", getAllDeliveryAgents);
router.get("/:id", getDeliveryAgentById);
router.put("/:id", updateDeliveryAgent);
router.delete("/:id", deleteDeliveryAgent);
router.patch("/:id/verify", toggleVerification);

export default router;
