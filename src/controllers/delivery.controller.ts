import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Update delivery status (e.g., on_the_way, delivered)
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
};
