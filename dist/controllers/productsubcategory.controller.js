"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubCategory = exports.updateSubCategory = exports.findSubCategory = exports.findSubCategoryByCategory = exports.getAllsubCategory = exports.createSubCategory = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product
const createSubCategory = async (req, res) => {
    const { name, categoryId } = req.body;
    const user = req.user;
    const newCategoryId = Number(categoryId);
    console.log(name, newCategoryId);
    if (!name) {
        console.warn(`Skipping subCategory ${name} due to missing data`);
    }
    else {
        try {
            const subCategory = await prisma_1.default.subCategory.create({
                data: {
                    name,
                    categoryId: newCategoryId,
                }
            });
            res.status(201).json(subCategory);
        }
        catch (err) {
            res.status(500).json({ message: "Failed to create subCategory.", error: err });
        }
    }
    ;
};
exports.createSubCategory = createSubCategory;
// Get All subCategory
const getAllsubCategory = async (_req, res) => {
    try {
        const subCategories = await prisma_1.default.subCategory.findMany({
            include: { category: true }, // <-- include related category
        });
        res.json(subCategories);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch subCategories." });
    }
};
exports.getAllsubCategory = getAllsubCategory;
// Get All subCategory
const findSubCategoryByCategory = async (_req, res) => {
    try {
        const _Category = await prisma_1.default.category.findUnique({
            where: { id: parseInt(_req.params.categoryid) }
        });
        if (_Category != null) {
            const subCategories = await prisma_1.default.subCategory.findMany({
                where: { categoryId: _Category?.id },
                include: { category: true },
            });
            res.json(subCategories);
        }
        else {
            res.json();
        }
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch subCategories." });
    }
};
exports.findSubCategoryByCategory = findSubCategoryByCategory;
// Find A subCategories
const findSubCategory = async (req, res) => {
    try {
        const subCategory = await prisma_1.default.subCategory.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { category: true },
        });
        if (!subCategory) {
            return res.status(404).json({ error: "subCategory not found" });
        }
        res.json(subCategory);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch subCategories." });
    }
};
exports.findSubCategory = findSubCategory;
// Update subCategories
const updateSubCategory = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { name } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const subCategories = await prisma_1.default.subCategory.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(subCategories);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update subCategory.", error: err });
    }
};
exports.updateSubCategory = updateSubCategory;
// Delete category
const deleteSubCategory = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        await prisma_1.default.subCategory.delete({ where: { id: parseInt(id) } });
        res.json({ message: "subCategory deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete subCategory." });
    }
};
exports.deleteSubCategory = deleteSubCategory;
