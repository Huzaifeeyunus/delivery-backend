"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTag = exports.updateTag = exports.findTag = exports.getAllTag = exports.createTag = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product
const createTag = async (req, res) => {
    const { name } = req.body;
    const user = req.user;
    if (!name) {
        console.warn(`Skipping tag ${name} due to missing data`);
    }
    else {
        try {
            const tag = await prisma_1.default.tag.create({
                data: {
                    name,
                }
            });
            res.status(201).json(tag);
        }
        catch (err) {
            res.status(500).json({ message: "Failed to create tag.", error: err });
        }
    }
    ;
};
exports.createTag = createTag;
// Get All tags
const getAllTag = async (_req, res) => {
    try {
        const tags = await prisma_1.default.tag.findMany();
        res.json(tags);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch tags." });
    }
};
exports.getAllTag = getAllTag;
// Find A tags
const findTag = async (req, res) => {
    try {
        const tag = await prisma_1.default.tag.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!tag) {
            return res.status(404).json({ error: "tag not found" });
        }
        res.json(tag);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch tags." });
    }
};
exports.findTag = findTag;
// Update tag
const updateTag = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { name, description, price, stock } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const tag = await prisma_1.default.tag.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(tag);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update tag.", error: err });
    }
};
exports.updateTag = updateTag;
// Delete tag
const deleteTag = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        await prisma_1.default.tag.delete({ where: { id: parseInt(id) } });
        res.json({ message: "tag deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete tag." });
    }
};
exports.deleteTag = deleteTag;
