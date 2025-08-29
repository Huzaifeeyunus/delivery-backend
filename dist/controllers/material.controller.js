"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterial = exports.updateMaterial = exports.findMaterial = exports.getAllMaterial = exports.createMaterial = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product
const createMaterial = async (req, res) => {
    const { name } = req.body;
    const user = req.user;
    if (!name) {
        console.warn(`Skipping material ${name} due to missing data`);
    }
    else {
        try {
            const material = await prisma_1.default.material.create({
                data: {
                    name,
                }
            });
            res.status(201).json(material);
        }
        catch (err) {
            res.status(500).json({ message: "Failed to create material.", error: err });
        }
    }
    ;
};
exports.createMaterial = createMaterial;
// Get All materials
const getAllMaterial = async (_req, res) => {
    try {
        const materials = await prisma_1.default.material.findMany();
        res.json(materials);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch materials." });
    }
};
exports.getAllMaterial = getAllMaterial;
// Find A materials
const findMaterial = async (req, res) => {
    try {
        const material = await prisma_1.default.material.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!material) {
            return res.status(404).json({ error: "material not found" });
        }
        res.json(material);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch materials." });
    }
};
exports.findMaterial = findMaterial;
// Update material
const updateMaterial = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { name, description, price, stock } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const material = await prisma_1.default.material.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(material);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update material.", error: err });
    }
};
exports.updateMaterial = updateMaterial;
// Delete material
const deleteMaterial = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        await prisma_1.default.material.delete({ where: { id: parseInt(id) } });
        res.json({ message: "material deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete material." });
    }
};
exports.deleteMaterial = deleteMaterial;
