import { Request, Response } from "express";
import prisma  from "../lib/prisma";

// Create a new address
export const createAddress = async (req: Request, res: Response) => {
  const userId = Number(req.user?.id);
  const { title, street, city, region, country, phone, longitude, latitude } = req.body;
 
  try {
    const address = await prisma.address.create({
      data: {
        userId,
        title,
        street,
        city,
        region,
        country,
        phone,
        longitude,
        latitude,
      },
    });

    
    res.status(201).json(address);
  } catch (err) {
    console.error("Create address error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all addresses for a user
export const getUserAddresses = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
    });

    res.json(addresses);
  } catch (err) {
    console.error("Get addresses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
 
// ✅ Set an address as default
 export const editAddress = async (req: Request, res: Response) => {
  try {
    const addressId = Number(req.params.id);
    const userId = req.user?.id; // assuming middleware injects user
    const { title, street, city, region, country, phone, isDefault } = req.body;

    // Check if address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      return res.status(404).json({ message: "Address not found" });
    }

    // If this one is marked as default, unset all others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }

    // Update all fields for this address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        title,
        street,
        city,
        region,
        country,
        phone,
        isDefault: !!isDefault,
      },
    });

    res.json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Set an address as default
export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const addressId = Number(req.params.id);
    const userId = req.user?.id; // assuming middleware injects user

    // Check if address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      return res.status(404).json({ message: "Address not found" });
    }

    const isDefault = req.body;
    // Reset all user's addresses to isDefault = false
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set chosen address as default
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: { isDefault },
    });

    res.json({
      message: "Default address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Delete address
export const deleteAddress = async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.address.delete({
    where: { id: Number(id) },
  });

  res.status(204).send();
};