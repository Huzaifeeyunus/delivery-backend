import { Request, Response } from "express";
import prisma from "../lib/prisma";

// ==========================
// Create Delivery Agent
// ==========================
export const createDeliveryAgent = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      licenseNumber,
      nationalId,
      vehicleType,
      vehiclePlate,
      vehicleColor,
      agentAddress,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      region,
      gpsLocation,
    } = req.body;

    const deliveryAgent = await prisma.deliveryAgent.create({
      data: {
        userId,
        licenseNumber,
        nationalId,
        vehicleType,
        vehiclePlate,
        vehicleColor,
        agentAddress,
        dateOfBirth: new Date(dateOfBirth),
        emergencyContactName,
        emergencyContactPhone,
        region,
        gpsLocation,
        profileImage: req.body.profileImage || null,
        idCardImage: req.body.idCardImage || null,
        licenseImage: req.body.licenseImage || null,
      },
    });

    res.status(201).json(deliveryAgent);
  } catch (err) {
    console.error("Error creating delivery agent:", err);
    res.status(500).json({ message: "Failed to create delivery agent." });
  }
};

// ==========================
// Get All Delivery Agents
// ==========================
export const getAllDeliveryAgents = async (_req: Request, res: Response) => {
  try {
    const agents = await prisma.deliveryAgent.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            roles: true,
          },
        },
      },
    });
    res.json(agents);
  } catch (err) {
    console.error("Error fetching delivery agents:", err);
    res.status(500).json({ message: "Failed to fetch delivery agents." });
  }
};

// ==========================
// Get Single Delivery Agent
// ==========================
export const getDeliveryAgentById = async (req: Request, res: Response) => {
  try {
    const agent = await prisma.deliveryAgent.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: "Delivery agent not found" });
    }

    res.json(agent);
  } catch (err) {
    console.error("Error fetching delivery agent:", err);
    res.status(500).json({ message: "Failed to fetch delivery agent." });
  }
};

// ==========================
// Update Delivery Agent
// ==========================
export const updateDeliveryAgent = async (req: Request, res: Response) => {
  try {
    const {
      licenseNumber,
      nationalId,
      vehicleType,
      vehiclePlate,
      vehicleColor,
      agentAddress,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      region,
      gpsLocation,
    } = req.body;

    const agent = await prisma.deliveryAgent.update({
      where: { id: req.params.id },
      data: {
        licenseNumber,
        nationalId,
        vehicleType,
        vehiclePlate,
        vehicleColor,
        agentAddress,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        emergencyContactName,
        emergencyContactPhone,
        region,
        gpsLocation,
        profileImage: req.body.profileImage || undefined,
        idCardImage: req.body.idCardImage || undefined,
        licenseImage: req.body.licenseImage || undefined,
      },
    });

    res.json(agent);
  } catch (err) {
    console.error("Error updating delivery agent:", err);
    res.status(500).json({ message: "Failed to update delivery agent." });
  }
};

// ==========================
// Delete Delivery Agent
// ==========================
export const deleteDeliveryAgent = async (req: Request, res: Response) => {
  try {
    await prisma.deliveryAgent.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Delivery agent deleted successfully." });
  } catch (err) {
    console.error("Error deleting delivery agent:", err);
    res.status(500).json({ message: "Failed to delete delivery agent." });
  }
};

// ==========================
// Toggle Verify / Active
// ==========================
export const toggleVerification = async (req: Request, res: Response) => {
  try {
    const { isVerified, isActive } = req.body;

    const agent = await prisma.deliveryAgent.update({
      where: { id: req.params.id },
      data: {
        isVerified,
        isActive,
      },
    });

    res.json(agent);
  } catch (err) {
    console.error("Error toggling verification:", err);
    res.status(500).json({ message: "Failed to update delivery agent status." });
  }
};
