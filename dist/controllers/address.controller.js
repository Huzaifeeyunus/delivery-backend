"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.setDefaultAddress = exports.editAddress = exports.getUserAddresses = exports.createAddress = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create a new address
const createAddress = async (req, res) => {
    const userId = Number(req.user?.id);
    const { title, street, city, region, country, phone, longitude, latitude } = req.body;
    try {
        const address = await prisma_1.default.address.create({
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
    }
    catch (err) {
        console.error("Create address error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createAddress = createAddress;
// Get all addresses for a user
const getUserAddresses = async (req, res) => {
    const userId = req.user?.id;
    try {
        const addresses = await prisma_1.default.address.findMany({
            where: { userId },
        });
        res.json(addresses);
    }
    catch (err) {
        console.error("Get addresses error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getUserAddresses = getUserAddresses;
// ✅ Set an address as default
const editAddress = async (req, res) => {
    try {
        const addressId = Number(req.params.id);
        const userId = req.user?.id; // assuming middleware injects user
        const { title, street, city, region, country, phone, isDefault } = req.body;
        // Check if address exists and belongs to user
        const address = await prisma_1.default.address.findUnique({
            where: { id: addressId },
        });
        if (!address || address.userId !== userId) {
            return res.status(404).json({ message: "Address not found" });
        }
        // If this one is marked as default, unset all others
        if (isDefault) {
            await prisma_1.default.address.updateMany({
                where: { userId, NOT: { id: addressId } },
                data: { isDefault: false },
            });
        }
        // Update all fields for this address
        const updatedAddress = await prisma_1.default.address.update({
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
    }
    catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.editAddress = editAddress;
// ✅ Set an address as default
const setDefaultAddress = async (req, res) => {
    try {
        const addressId = Number(req.params.id);
        const userId = req.user?.id; // assuming middleware injects user
        // Check if address exists and belongs to user
        const address = await prisma_1.default.address.findUnique({
            where: { id: addressId },
        });
        if (!address || address.userId !== userId) {
            return res.status(404).json({ message: "Address not found" });
        }
        const isDefault = req.body;
        // Reset all user's addresses to isDefault = false
        await prisma_1.default.address.updateMany({
            where: { userId },
            data: { isDefault: false },
        });
        // Set chosen address as default
        const updatedAddress = await prisma_1.default.address.update({
            where: { id: addressId },
            data: { isDefault },
        });
        res.json({
            message: "Default address updated successfully",
            address: updatedAddress,
        });
    }
    catch (error) {
        console.error("Error setting default address:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.setDefaultAddress = setDefaultAddress;
// Delete address
const deleteAddress = async (req, res) => {
    const { id } = req.params;
    await prisma_1.default.address.delete({
        where: { id: Number(id) },
    });
    res.status(204).send();
};
exports.deleteAddress = deleteAddress;
