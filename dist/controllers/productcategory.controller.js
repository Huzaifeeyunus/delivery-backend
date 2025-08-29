"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletecategory = exports.updatecategory = exports.findcategory = exports.getAllCategory = exports.createCategory = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create Product
const createCategory = async (req, res) => {
    const { name } = req.body;
    const user = req.user;
    if (!name) {
        console.warn(`Skipping category ${name} due to missing data`);
    }
    else {
        try {
            const category = await prisma_1.default.category.create({
                data: {
                    name,
                }
            });
            res.status(201).json(category);
        }
        catch (err) {
            res.status(500).json({ message: "Failed to create category.", error: err });
        }
    }
    ;
};
exports.createCategory = createCategory;
// Get All categorys
const getAllCategory = async (_req, res) => {
    try {
        const categorys = await prisma_1.default.category.findMany({
            include: { subCategories: true }
        });
        res.json(categorys);
    }
    catch (err) {
        res.status(500).json({
            message: "Failed to fetch categories...",
            error: err.message || err, // show real error in response
        });
    }
};
exports.getAllCategory = getAllCategory;
// Find A categorys
const findcategory = async (req, res) => {
    try {
        const category = await prisma_1.default.category.findUnique({
            where: { id: parseInt(req.params.id) }, include: { subCategories: true }
        });
        if (!category) {
            return res.status(404).json({ error: "category not found" });
        }
        res.json(category);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch categorys." });
    }
};
exports.findcategory = findcategory;
// Update category
const updatecategory = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { name, description, price, stock } = req.body;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        const category = await prisma_1.default.category.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.json(category);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update category.", error: err });
    }
};
exports.updatecategory = updatecategory;
// Delete category
const deletecategory = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        await prisma_1.default.category.delete({ where: { id: parseInt(id) } });
        res.json({ message: "category deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete category." });
    }
};
exports.deletecategory = deletecategory;
