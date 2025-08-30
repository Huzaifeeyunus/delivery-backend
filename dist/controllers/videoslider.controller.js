"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideoSlider = exports.updateVideoSlider = exports.findVideoSlider = exports.findVideoSliderVideo = exports.getVideoSliders = exports.createVideoSlider = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Create VideoSlider 
const createVideoSlider = async (req, res) => {
    const { files } = req;
    try {
        const { category, name, description, longDescription } = req.body;
        const user = req.user;
        if (!user?.id)
            return res.status(403).json({ message: "Not a user." });
        const videoFiles = files.videos || [];
        if (videoFiles.length > 0) {
            const videosData = videoFiles.map((file) => ({
                category,
                name,
                description,
                longDescription,
                videoUrl: `/uploads/sliders/videos/${file.filename}`,
            }));
            await prisma_1.default.videoslider.createMany({
                data: videosData
            });
        }
        // Step 4 — return full videoslider
        const fullVideoSlider = await prisma_1.default.videoslider.findMany();
        res.status(201).json(fullVideoSlider);
    }
    catch (err) {
        console.error("Error creating videoslider:", err);
        res.status(500).json({ message: "Failed to create videoslider.", error: err });
    }
};
exports.createVideoSlider = createVideoSlider;
// Get All VideoSliders
const getVideoSliders = async (_req, res) => {
    const { categoryId, subCategoryId } = _req.query;
    try {
        if (categoryId && !subCategoryId) {
            const videosliders = await prisma_1.default.videoslider.findMany();
            res.json(videosliders);
        }
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch videosliders." });
    }
};
exports.getVideoSliders = getVideoSliders;
// Get All VideoSliders
const findVideoSliderVideo = async (_req, res) => {
    try {
        const videosliderVideo = await prisma_1.default.videoslider.findMany({
            where: { id: parseInt(_req.params.id) },
        });
        res.json(videosliderVideo);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch videosliders." });
    }
};
exports.findVideoSliderVideo = findVideoSliderVideo;
// Find A VideoSliders
const findVideoSlider = async (req, res) => {
    try {
        const videoslider = await prisma_1.default.videoslider.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!videoslider) {
            return res.status(404).json({ error: "VideoSlider not found" });
        }
        res.json(videoslider);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch videosliders." });
    }
};
exports.findVideoSlider = findVideoSlider;
// Update VideoSlider 
const updateVideoSlider = async (req, res) => {
    const { files } = req;
    const id = Number(req.params.id);
    try {
        const { category, name, shortDescription, longDescription, } = req.body;
        const user = req.user;
        if (!user?.id)
            return res.status(403).json({ message: "Not a user." });
        // Handle video
        const videoFiles = files.videos || [];
        if (videoFiles.length > 0) {
            await Promise.all(videoFiles.map(file => prisma_1.default.videoslider.create({
                data: {
                    category,
                    name,
                    shortDescription,
                    longDescription,
                    videoUrl: `/uploads/videosliders/videos/${file.filename}`,
                },
            })));
        }
        // Step 4 — return full videoslider
        const fullVideoSlider = await prisma_1.default.videoslider.findUnique({
            where: { id: id },
        });
        res.status(201).json(fullVideoSlider);
    }
    catch (err) {
        console.error("Error update videoslider:", err);
        res.status(500).json({ message: "Failed to update videoslider.", error: err });
    }
};
exports.updateVideoSlider = updateVideoSlider;
// Delete VideoSlider
const deleteVideoSlider = async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    try {
        if (!user?.id) {
            if (!user?.email.startsWith("huzaifeeyunus")) {
                return res.status(403).json({ message: "Not a vendor." });
            }
        }
        await prisma_1.default.videoslider.delete({ where: { id: parseInt(id) } });
        res.json({ message: "VideoSlider deleted." });
    }
    catch (err) {
        console.error("Error update videoslider:", err);
        res.status(500).json({ message: "Failed to delete videoslider." });
    }
};
exports.deleteVideoSlider = deleteVideoSlider;
