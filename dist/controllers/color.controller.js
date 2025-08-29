"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteColor = exports.updateColor = exports.findColor = exports.getAllColor = exports.createColor = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product
const createColor = async (req, res) => {
    const { name } = req.body;
    const user = req.user;
    if (!name) {
        console.warn(`Skipping color ${name} due to missing data`);
    }
    else {
        try {
            const color = await prisma_1.default.color.create({
                data: {
                    name,
                }
            });
            res.status(201).json(color);
        }
        catch (err) {
            res.status(500).json({ message: "Failed to create color.", error: err });
        }
    }
    ;
};
exports.createColor = createColor;
// Get All colors
const getAllColor = async (_req, res) => {
    try {
        const colors = await prisma_1.default.color.findMany();
        res.json(colors);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch colors." });
    }
};
exports.getAllColor = getAllColor;
// Find A colors
const findColor = async (req, res) => {
    try {
        const color = await prisma_1.default.color.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!color) {
            return res.status(404).json({ error: "color not found" });
        }
        res.json(color);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch colors." });
    }
};
exports.findColor = findColor;
// Update color
const updateColor = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { name, description, price, stock } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const color = await prisma_1.default.color.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(color);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update color.", error: err });
    }
};
exports.updateColor = updateColor;
// Delete color
const deleteColor = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        await prisma_1.default.color.delete({ where: { id: parseInt(id) } });
        res.json({ message: "color deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete color." });
    }
};
exports.deleteColor = deleteColor;
