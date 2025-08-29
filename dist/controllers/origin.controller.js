"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrigin = exports.updateOrigin = exports.findOrigin = exports.getAllOrigin = exports.createOrigin = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product
const createOrigin = async (req, res) => {
    const { name } = req.body;
    const user = req.user;
    if (!name) {
        console.warn(`Skipping origin ${name} due to missing data`);
    }
    else {
        try {
            const origin = await prisma_1.default.origin.create({
                data: {
                    name,
                }
            });
            res.status(201).json(origin);
        }
        catch (err) {
            res.status(500).json({ message: "Failed to create origin.", error: err });
        }
    }
    ;
};
exports.createOrigin = createOrigin;
// Get All origins
const getAllOrigin = async (_req, res) => {
    try {
        const origins = await prisma_1.default.origin.findMany();
        res.json(origins);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch origins." });
    }
};
exports.getAllOrigin = getAllOrigin;
// Find A origins
const findOrigin = async (req, res) => {
    try {
        const origin = await prisma_1.default.origin.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!origin) {
            return res.status(404).json({ error: "origin not found" });
        }
        res.json(origin);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch origins." });
    }
};
exports.findOrigin = findOrigin;
// Update origin
const updateOrigin = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { name, description, price, stock } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const origin = await prisma_1.default.origin.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(origin);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update origin.", error: err });
    }
};
exports.updateOrigin = updateOrigin;
// Delete origin
const deleteOrigin = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        await prisma_1.default.origin.delete({ where: { id: parseInt(id) } });
        res.json({ message: "origin deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete origin." });
    }
};
exports.deleteOrigin = deleteOrigin;
