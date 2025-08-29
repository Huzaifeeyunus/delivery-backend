"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnusedImages = deleteUnusedImages;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../lib/prisma"));
async function deleteUnusedImages() {
    try {
        // 1. Get all image filenames from DB
        const productImages = await prisma_1.default.productImage.findMany({
            select: { url: true }
        });
        const dbFiles = new Set(productImages.map(img => path_1.default.basename(img.url)));
        // 2. Try to find the images directory dynamically
        const possiblePaths = [
            path_1.default.join(__dirname, "../../public/images"), // for public/images
            path_1.default.join(__dirname, "../images") // for src/images
        ];
        console.log(__dirname);
        console.log(possiblePaths);
        let imagesDir = null;
        for (const dir of possiblePaths) {
            if (fs_1.default.existsSync(dir)) {
                imagesDir = dir;
                break;
            }
        }
        if (!imagesDir) {
            console.error("❌ No images folder found in expected locations.");
            return;
        }
        console.log(`🖼 Scanning images in: ${imagesDir}`);
        // 3. Read all files
        const allFiles = fs_1.default.readdirSync(imagesDir);
        // 4. Delete unused files
        let deletedCount = 0;
        for (const file of allFiles) {
            if (!dbFiles.has(file)) {
                fs_1.default.unlinkSync(path_1.default.join(imagesDir, file));
                deletedCount++;
            }
        }
        console.log(`✅ Cleanup complete. Deleted ${deletedCount} unused images.`);
    }
    catch (error) {
        console.log(error);
        console.error("❌ Error deleting unused images:", error);
    }
}
