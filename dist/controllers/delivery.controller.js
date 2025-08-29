"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeliveryStatus = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Update delivery status (e.g., on_the_way, delivered)
const updateDeliveryStatus = async (req, res) => {
    const { deliveryId } = req.params;
    const { status, driverId, notes } = req.body;
    try {
        const delivery = await prisma_1.default.delivery.update({
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
    }
    catch (error) {
        console.error("❌ Delivery update error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateDeliveryStatus = updateDeliveryStatus;
