"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageSlider = exports.updateImageSlider = exports.findImageSlider = exports.getImageSliderByCategory = exports.getAllImageSlider = exports.createImageSlider = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create ImageSlider 
const createImageSlider = async (req, res) => {
    try {
        const { category, name, description, longDescription } = req.body;
        const user = req.user;
        if (!user?.id)
            return res.status(403).json({ message: "Not a user." });
        if (!category || !name)
            return res.status(400).json({ message: "Category and name are required." });
        // multer.any() puts all files into an array
        const allFiles = req.files || [];
        // only take files with fieldname "images"
        const imageFiles = allFiles.filter(f => f.fieldname === "images");
        if (imageFiles.length === 0) {
            return res.status(400).json({ message: "At least one image is required." });
        }
        const imagesData = imageFiles.map(file => ({
            category,
            name,
            shortDescription: description,
            longDescription,
            imageUrl: `/uploads/images/slider/images/${file.filename}`,
        }));
        await prisma_1.default.imageSlider.createMany({ data: imagesData });
        const fullImageSlider = await prisma_1.default.imageSlider.findMany();
        res.status(201).json(fullImageSlider);
    }
    catch (err) {
        console.error("Error creating imageslider:", err);
        res.status(500).json({ message: "Failed to create imageslider.", error: err });
    }
};
exports.createImageSlider = createImageSlider;
// ✅ Get All ImageSliders
const getAllImageSlider = async (_req, res) => {
    try {
        const sliders = await prisma_1.default.imageSlider.findMany();
        // Don’t add host, keep raw path (frontend will prepend host)
        const withFullUrls = sliders.map((s) => ({
            ...s,
            imageUrl: `${s.imageUrl}`,
        }));
        res.json(withFullUrls);
    }
    catch (err) {
        console.error("Error fetching image sliders:", err);
        res.status(500).json({ message: "Failed to fetch imagesliders." });
    }
};
exports.getAllImageSlider = getAllImageSlider;
// ✅ Get ImageSlider by Category / SubCategory
const getImageSliderByCategory = async (req, res) => {
    const { categoryId, subCategoryId } = req.query;
    try {
        let where = {};
        if (categoryId)
            where.category = String(categoryId);
        if (subCategoryId)
            where.subCategory = String(subCategoryId);
        const imagesliders = await prisma_1.default.imageSlider.findMany({ where });
        res.json(imagesliders);
    }
    catch (err) {
        console.error("Error fetching image sliders by category:", err);
        res.status(500).json({ message: "Failed to fetch imagesliders." });
    }
};
exports.getImageSliderByCategory = getImageSliderByCategory;
// ✅ Find a single ImageSlider
const findImageSlider = async (req, res) => {
    try {
        const id = Number(req.params.id) || 0;
        const imageslider = await prisma_1.default.imageSlider.findUnique({
            where: { id },
        });
        if (!imageslider) {
            return res.status(404).json({ error: "ImageSlider not found" });
        }
        res.json(imageslider);
    }
    catch (err) {
        console.error("Error finding image slider:", err);
        res.status(500).json({ message: "Failed to fetch imageslider." });
    }
};
exports.findImageSlider = findImageSlider;
// ✅ Update ImageSlider
const updateImageSlider = async (req, res) => {
    const { files } = req;
    const id = Number(req.params.id);
    try {
        const { category, name, shortDescription, longDescription } = req.body;
        const user = req.user;
        if (!user?.id)
            return res.status(403).json({ message: "Not a user." });
        // Handle uploaded image
        let imageUrl = undefined;
        const imageFiles = files?.images || [];
        if (imageFiles.length > 0) {
            imageUrl = `/uploads/images/slider/images/${imageFiles[0].filename}`;
        }
        const updated = await prisma_1.default.imageSlider.update({
            where: { id },
            data: {
                category,
                name,
                shortDescription,
                longDescription,
                ...(imageUrl ? { imageUrl } : {}),
            },
        });
        res.json(updated);
    }
    catch (err) {
        console.error("Error updating imageslider:", err);
        res.status(500).json({ message: "Failed to update imageslider.", error: err });
    }
};
exports.updateImageSlider = updateImageSlider;
// ✅ Delete ImageSlider
const deleteImageSlider = async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    try {
        if (!user?.id && !user?.email?.startsWith("huzaifeeyunus")) {
            return res.status(403).json({ message: "Not authorized." });
        }
        await prisma_1.default.imageSlider.delete({ where: { id: parseInt(id) } });
        res.json({ message: "ImageSlider deleted." });
    }
    catch (err) {
        console.error("Error deleting imageslider:", err);
        res.status(500).json({ message: "Failed to delete imageslider." });
    }
};
exports.deleteImageSlider = deleteImageSlider;
