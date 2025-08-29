"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBrand = exports.updateBrand = exports.findBrand = exports.getAllBrand = exports.createBrand = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product
const createBrand = async (req, res) => {
    const { name } = req.body;
    const user = req.user;
    if (!name) {
        console.warn(`Skipping brand ${name} due to missing data`);
    }
    else {
        try {
            const brand = await prisma_1.default.brand.create({
                data: {
                    name,
                }
            });
            res.status(201).json(brand);
        }
        catch (err) {
            res.status(500).json({ message: "Failed to create brand.", error: err });
        }
    }
    ;
};
exports.createBrand = createBrand;
// Get All brands
const getAllBrand = async (_req, res) => {
    try {
        const brands = await prisma_1.default.brand.findMany();
        res.json(brands);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch brands." });
    }
};
exports.getAllBrand = getAllBrand;
// Find A brands
const findBrand = async (req, res) => {
    try {
        const brand = await prisma_1.default.brand.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!brand) {
            return res.status(404).json({ error: "brand not found" });
        }
        res.json(brand);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch brands." });
    }
};
exports.findBrand = findBrand;
// Update brand
const updateBrand = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { name, description, price, stock } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const brand = await prisma_1.default.brand.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(brand);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update brand.", error: err });
    }
};
exports.updateBrand = updateBrand;
// Delete brand
const deleteBrand = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        await prisma_1.default.brand.delete({ where: { id: parseInt(id) } });
        res.json({ message: "brand deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete brand." });
    }
};
exports.deleteBrand = deleteBrand;
