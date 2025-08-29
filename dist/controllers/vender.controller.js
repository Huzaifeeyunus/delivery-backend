"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVendor = exports.updateVendor = exports.findVendor = exports.getAllVendor = exports.createVendor = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product 
const createVendor = async (req, res) => {
    const { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude, shopAddress, shopEmail, shopWebsite, shopOwner, isActive } = req.body;
    const userId = Number(req.user?.id);
    if (!shopName) {
        console.warn(`Skipping vendor ${shopName} due to missing data`);
    }
    else {
        try {
            console.log(req.body);
            const newIsActive = Boolean(isActive) || false;
            const vendor = await prisma_1.default.vendor.create({
                data: {
                    userId,
                    shopName, shopPhone, shopLocation, shopLongitude, shopLatitude,
                    shopAddress, shopEmail, shopWebsite, shopOwner, isActive: newIsActive,
                }
            });
            res.status(201).json(vendor);
        }
        catch (err) {
            console.log(err);
            res.status(500).json({ message: "Failed to create vendor.", error: err });
        }
    }
    ;
};
exports.createVendor = createVendor;
// Get All vendors
const getAllVendor = async (_req, res) => {
    try {
        const vendors = await prisma_1.default.vendor.findMany();
        res.json(vendors);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch vendors." });
    }
};
exports.getAllVendor = getAllVendor;
// Find A vendors
const findVendor = async (req, res) => {
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!vendor) {
            return res.status(404).json({ error: "vendor not found" });
        }
        res.json(vendor);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch vendors." });
    }
};
exports.findVendor = findVendor;
// Update vendor
const updateVendor = async (req, res) => {
    const { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude, shopAddress, shopEmail, shopWebsite, shopOwner, isActive } = req.body;
    const id = Number(req.params);
    const userId = Number(req.user);
    const { name, description, price, stock } = req.body;
    try {
        const _vendor = await prisma_1.default.vendor.findUnique({
            where: { id },
        });
        if (!_vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const updated_vendor = await prisma_1.default.vendor.update({
            where: { id: id },
            data: { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude,
                shopAddress, shopEmail, shopWebsite, shopOwner, isActive },
        });
        res.json(updated_vendor);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update vendor.", error: err });
    }
};
exports.updateVendor = updateVendor;
// Delete vendor
const deleteVendor = async (req, res) => {
    const id = Number(req.params);
    const userId = Number(req.user);
    try {
        const _vendor = await prisma_1.default.vendor.findUnique({
            where: { id },
        });
        if (!_vendor)
            return res.status(403).json({ message: "Not a vendor." });
        await prisma_1.default.vendor.delete({ where: { id: id } });
        res.json({ message: "vendor deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete vendor." });
    }
};
exports.deleteVendor = deleteVendor;
