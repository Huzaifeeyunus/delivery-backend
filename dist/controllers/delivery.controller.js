"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDelivery = exports.updateDeliveryStatus = exports.updateDelivery = exports.getDeliveryById = exports.getAllDeliveries = exports.createDelivery = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Update delivery status (e.g., on_the_way, delivered)
// ✅ Create a new delivery
const createDelivery = async (req, res) => {
    try {
        const { orderId, driverId, status, notes } = req.body;
        const delivery = await prisma_1.default.delivery.create({
            data: {
                orderId: Number(orderId),
                driverId: driverId ? Number(driverId) : null,
                status: status || "pending",
                notes: notes || null,
            },
        });
        res.status(201).json(delivery);
    }
    catch (error) {
        console.error("❌ Create delivery error:", error);
        res.status(500).json({ error: "Failed to create delivery" });
    }
};
exports.createDelivery = createDelivery;
// ✅ Get all deliveries
const getAllDeliveries = async (_req, res) => {
    try {
        const deliveries = await prisma_1.default.delivery.findMany({
            include: {
                order: true,
            },
        });
        res.json(deliveries);
    }
    catch (error) {
        console.error("❌ Get deliveries error:", error);
        res.status(500).json({ error: "Failed to fetch deliveries" });
    }
};
exports.getAllDeliveries = getAllDeliveries;
// ✅ Get single delivery by ID
const getDeliveryById = async (req, res) => {
    try {
        const { id } = req.params;
        const delivery = await prisma_1.default.delivery.findUnique({
            where: { id: Number(id) },
            include: {
                order: true,
            },
        });
        if (!delivery) {
            return res.status(404).json({ error: "Delivery not found" });
        }
        res.json(delivery);
    }
    catch (error) {
        console.error("❌ Get delivery error:", error);
        res.status(500).json({ error: "Failed to fetch delivery" });
    }
};
exports.getDeliveryById = getDeliveryById;
// ✅ Update delivery (general update, not just status)
const updateDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const { driverId, status, notes } = req.body;
        const delivery = await prisma_1.default.delivery.update({
            where: { id: Number(id) },
            data: {
                driverId: driverId ? Number(driverId) : undefined,
                status,
                notes,
            },
        });
        res.json(delivery);
    }
    catch (error) {
        console.error("❌ Update delivery error:", error);
        res.status(500).json({ error: "Failed to update delivery" });
    }
};
exports.updateDelivery = updateDelivery;
// ✅ Update only delivery status
const updateDeliveryStatus = async (req, res) => {
    const { deliveryId } = req.params;
    const { status, driverId, notes } = req.body;
    try {
        const delivery = await prisma_1.default.delivery.update({
            where: { id: Number(deliveryId) },
            data: {
                status,
                notes,
                driverId: driverId ? Number(driverId) : undefined,
                startedAt: status === "on_the_way" ? new Date() : undefined,
                deliveredAt: status === "delivered" ? new Date() : undefined,
            },
        });
        res.json(delivery);
    }
    catch (error) {
        console.error("❌ Delivery update error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateDeliveryStatus = updateDeliveryStatus;
// ✅ Delete a delivery
const deleteDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.delivery.delete({
            where: { id: Number(id) },
        });
        res.json({ message: "Delivery deleted successfully" });
    }
    catch (error) {
        console.error("❌ Delete delivery error:", error);
        res.status(500).json({ error: "Failed to delete delivery" });
    }
};
exports.deleteDelivery = deleteDelivery;
/*
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const { status, driverId, notes } = req.body;

  try {
    const delivery = await prisma.delivery.update({
      where: { id: Number(deliveryId) },
      data: {
        status,
        notes,
        driverId,
        startedAt: status === "on_the_way" ? new Date() : undefined,
        deliveredAt: status === "delivered" ? new Date() : undefined,
      },
    });

    res.json(delivery);
  } catch (error) {
    console.error("❌ Delivery update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; */
