"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVendor = exports.updateVendor = exports.findVendor = exports.getAllVendor = exports.createVendor = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Helper: get uploaded image URLs
const getUploadedImages = (files) => {
    if (!files || files.length === 0)
        return [];
    return files.map(file => `/uploads/vendors/images/${file.filename}`);
};
// Helper: get uploaded video URLs
const getUploadedVideos = (files) => {
    if (!files || files.length === 0)
        return [];
    return files.map(file => `/uploads/vendors/videos/${file.filename}`);
};
// -------------------- CREATE VENDOR --------------------
const createVendor = async (req, res) => {
    const { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude, shopAddress, shopEmail, shopWebsite, shopOwner, isActive } = req.body;
    const userId = Number(req.user?.id);
    if (!shopName)
        return res.status(400).json({ message: "Shop name is required." });
    try {
        // ✅ Check if user already has a vendor
        const existingVendor = await prisma_1.default.vendor.findUnique({ where: { userId } });
        if (existingVendor) {
            return res.status(400).json({ message: "You already have a vendor." });
        }
        // Get uploaded images and videos
        const imageUrls = getUploadedImages(req.files);
        const videoUrls = getUploadedVideos(req.files);
        const newIsActive = Boolean(isActive) || false;
        // Create vendor with nested images/videos
        const vendor = await prisma_1.default.vendor.create({
            data: {
                userId,
                shopName,
                shopPhone,
                shopLocation,
                shopLongitude: shopLongitude ? Number(shopLongitude) : undefined,
                shopLatitude: shopLatitude ? Number(shopLatitude) : undefined,
                shopAddress,
                shopEmail,
                shopWebsite,
                shopOwner,
                isActive: newIsActive,
                images: {
                    create: imageUrls.map(url => ({ url })),
                },
                videos: {
                    create: videoUrls.map(url => ({ url })),
                },
            },
            include: {
                images: true,
                videos: true,
            },
        });
        res.status(201).json(vendor);
    }
    catch (err) {
        console.error("Create Vendor Error:", err);
        res.status(500).json({ message: "Failed to create vendor.", error: err });
    }
};
exports.createVendor = createVendor;
// -------------------- GET ALL VENDORS --------------------
const getAllVendor = async (_req, res) => {
    try {
        const vendors = await prisma_1.default.vendor.findMany({
            include: { images: true, videos: true, orders: true },
        });
        res.json(vendors);
    }
    catch (err) {
        console.error("Get All Vendors Error:", err);
        res.status(500).json({ message: "Failed to fetch vendors.", error: err });
    }
};
exports.getAllVendor = getAllVendor;
// -------------------- GET VENDOR BY ID --------------------
const findVendor = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { id },
            include: { images: true, videos: true, orders: true },
        });
        if (!vendor)
            return res.status(404).json({ message: "Vendor not found." });
        res.json(vendor);
    }
    catch (err) {
        console.error("Find Vendor Error:", err);
        res.status(500).json({ message: "Failed to fetch vendor.", error: err });
    }
};
exports.findVendor = findVendor;
// -------------------- UPDATE VENDOR --------------------
// -------------------- UPDATE VENDOR --------------------
const updateVendor = async (req, res) => {
    const id = Number(req.params.id);
    const { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude, shopAddress, shopEmail, shopWebsite, shopOwner, isActive } = req.body;
    try {
        // Find existing vendor with images/videos
        const existingVendor = await prisma_1.default.vendor.findUnique({
            where: { id },
            include: { images: true, videos: true },
        });
        if (!existingVendor)
            return res.status(404).json({ message: "Vendor not found." });
        // Get newly uploaded images/videos
        const newImageUrls = getUploadedImages(req.files);
        const newVideoUrls = getUploadedVideos(req.files);
        // Update vendor and create new nested images/videos
        const updatedVendor = await prisma_1.default.vendor.update({
            where: { id },
            data: {
                shopName,
                shopPhone,
                shopLocation,
                shopLongitude: shopLongitude ? Number(shopLongitude) : undefined,
                shopLatitude: shopLatitude ? Number(shopLatitude) : undefined,
                shopAddress,
                shopEmail,
                shopWebsite,
                shopOwner,
                isActive: Boolean(isActive),
                images: {
                    create: newImageUrls.map(url => ({ url })),
                },
                videos: {
                    create: newVideoUrls.map(url => ({ url })),
                },
            },
            include: { images: true, videos: true },
        });
        res.json(updatedVendor);
    }
    catch (err) {
        console.error("Update Vendor Error:", err);
        res.status(500).json({ message: "Failed to update vendor.", error: err });
    }
};
exports.updateVendor = updateVendor;
// -------------------- DELETE VENDOR --------------------
const deleteVendor = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { id },
            include: { images: true, videos: true },
        });
        if (!vendor)
            return res.status(404).json({ message: "Vendor not found." });
        // Delete images from disk
        vendor.images.forEach((img) => {
            const filePath = path_1.default.join(__dirname, "..", img.url);
            if (fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
        });
        // Delete videos from disk
        vendor.videos.forEach((video) => {
            const filePath = path_1.default.join(__dirname, "..", video.url);
            if (fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
        });
        await prisma_1.default.vendor.delete({ where: { id } });
        res.json({ message: "Vendor deleted." });
    }
    catch (err) {
        console.error("Delete Vendor Error:", err);
        res.status(500).json({ message: "Failed to delete vendor.", error: err });
    }
};
exports.deleteVendor = deleteVendor;
