import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Update delivery status (e.g., on_the_way, delivered)
 
// ✅ Create a new delivery
export const createDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId, driverId, status, notes } = req.body;

    const delivery = await prisma.delivery.create({
      data: {
        orderId: Number(orderId),
        driverId: driverId ? Number(driverId) : null,
        status: status || "pending",
        notes: notes || null,
      },
    });

    res.status(201).json(delivery);
  } catch (error) {
    console.error("❌ Create delivery error:", error);
    res.status(500).json({ error: "Failed to create delivery" });
  }
};

// ✅ Get all deliveries
export const getAllDeliveries = async (_req: Request, res: Response) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      include: {
        order: true, 
      },
    });

    res.json(deliveries);
  } catch (error) {
    console.error("❌ Get deliveries error:", error);
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
};

// ✅ Get single delivery by ID
export const getDeliveryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
      include: {
        order: true, 
      },
    });

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    res.json(delivery);
  } catch (error) {
    console.error("❌ Get delivery error:", error);
    res.status(500).json({ error: "Failed to fetch delivery" });
  }
};

// ✅ Update delivery (general update, not just status)
export const updateDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driverId, status, notes } = req.body;

    const delivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: {
        driverId: driverId ? Number(driverId) : undefined,
        status,
        notes,
      },
    });

    res.json(delivery);
  } catch (error) {
    console.error("❌ Update delivery error:", error);
    res.status(500).json({ error: "Failed to update delivery" });
  }
};

// ✅ Update only delivery status
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const { status, driverId, notes } = req.body;

  try {
    const delivery = await prisma.delivery.update({
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
  } catch (error) {
    console.error("❌ Delivery update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Delete a delivery
export const deleteDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.delivery.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Delivery deleted successfully" });
  } catch (error) {
    console.error("❌ Delete delivery error:", error);
    res.status(500).json({ error: "Failed to delete delivery" });
  }
};

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
