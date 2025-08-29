"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSize = exports.updateSize = exports.findSize = exports.getAllSize = exports.createSize = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product
const createSize = async (req, res) => {
    const { name } = req.body;
    const user = req.user;
    if (!name) {
        console.warn(`Skipping size ${name} due to missing data`);
    }
    else {
        try {
            const size = await prisma_1.default.size.create({
                data: {
                    name,
                }
            });
            res.status(201).json(size);
        }
        catch (err) {
            res.status(500).json({ message: "Failed to create size.", error: err });
        }
    }
    ;
};
exports.createSize = createSize;
// Get All sizes
const getAllSize = async (_req, res) => {
    try {
        const sizes = await prisma_1.default.size.findMany();
        res.json(sizes);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch sizes." });
    }
};
exports.getAllSize = getAllSize;
// Find A sizes
const findSize = async (req, res) => {
    try {
        const size = await prisma_1.default.size.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!size) {
            return res.status(404).json({ error: "size not found" });
        }
        res.json(size);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch sizes." });
    }
};
exports.findSize = findSize;
// Update size
const updateSize = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { name, description, price, stock } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const size = await prisma_1.default.size.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(size);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update size.", error: err });
    }
};
exports.updateSize = updateSize;
// Delete size
const deleteSize = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        await prisma_1.default.size.delete({ where: { id: parseInt(id) } });
        res.json({ message: "size deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete size." });
    }
};
exports.deleteSize = deleteSize;
