"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageSlider = exports.updateImageSlider = exports.findImageSlider = exports.findImageSliderImage = exports.getImageSliders = exports.createImageSlider = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create ImageSlider 
const createImageSlider = async (req, res) => {
    const { files } = req;
    try {
        const { category, name, description, longDescription } = req.body;
        const user = req.user;
        if (!user?.id)
            return res.status(403).json({ message: "Not a user." });
        const imageFiles = files.images || [];
        if (imageFiles.length > 0) {
            const imagesData = imageFiles.map((file) => ({
                category,
                name,
                description,
                longDescription,
                imageUrl: `/uploads/sliders/images/${file.filename}`,
            }));
            await prisma_1.default.imageSlider.createMany({
                data: imagesData
            });
        }
        // Step 4 — return full imageslider
        const fullImageSlider = await prisma_1.default.imageSlider.findMany();
        res.status(201).json(fullImageSlider);
    }
    catch (err) {
        console.error("Error creating imageslider:", err);
        res.status(500).json({ message: "Failed to create imageslider.", error: err });
    }
};
exports.createImageSlider = createImageSlider;
// Get All ImageSliders
const getImageSliders = async (_req, res) => {
    const { categoryId, subCategoryId } = _req.query;
    try {
        if (categoryId && !subCategoryId) {
            const imagesliders = await prisma_1.default.imageSlider.findMany();
            res.json(imagesliders);
        }
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch imagesliders." });
    }
};
exports.getImageSliders = getImageSliders;
// Get All ImageSliders
const findImageSliderImage = async (_req, res) => {
    try {
        const imagesliderImage = await prisma_1.default.imageSlider.findMany({
            where: { id: parseInt(_req.params.id) },
        });
        res.json(imagesliderImage);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch imagesliders." });
    }
};
exports.findImageSliderImage = findImageSliderImage;
// Find A ImageSliders
const findImageSlider = async (req, res) => {
    try {
        const imageslider = await prisma_1.default.imageSlider.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!imageslider) {
            return res.status(404).json({ error: "ImageSlider not found" });
        }
        res.json(imageslider);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch imagesliders." });
    }
};
exports.findImageSlider = findImageSlider;
// Update ImageSlider 
const updateImageSlider = async (req, res) => {
    const { files } = req;
    const id = Number(req.params.id);
    try {
        const { category, name, shortDescription, longDescription,
        // This will be an array from the formData 
         } = req.body;
        const user = req.user;
        if (!user?.id)
            return res.status(403).json({ message: "Not a user." });
        // Handle image
        const imageFiles = files.videos || [];
        if (imageFiles.length > 0) {
            await Promise.all(imageFiles.map(file => prisma_1.default.imageSlider.create({
                data: {
                    category,
                    name,
                    shortDescription,
                    longDescription,
                    imageUrl: `/uploads/imagesliders/videos/${file.filename}`,
                },
            })));
        }
        // Step 4 — return full imageslider
        const fullImageSlider = await prisma_1.default.imageSlider.findUnique({
            where: { id: id },
        });
        res.status(201).json(fullImageSlider);
    }
    catch (err) {
        console.error("Error update imageslider:", err);
        res.status(500).json({ message: "Failed to update imageslider.", error: err });
    }
};
exports.updateImageSlider = updateImageSlider;
// Delete ImageSlider
const deleteImageSlider = async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    try {
        if (!user?.id) {
            if (!user?.email.startsWith("huzaifeeyunus")) {
                return res.status(403).json({ message: "Not a vendor." });
            }
        }
        await prisma_1.default.imageSlider.delete({ where: { id: parseInt(id) } });
        res.json({ message: "ImageSlider deleted." });
    }
    catch (err) {
        console.error("Error update imageslider:", err);
        res.status(500).json({ message: "Failed to delete imageslider." });
    }
};
exports.deleteImageSlider = deleteImageSlider;
