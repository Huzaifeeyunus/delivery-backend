import fs from "fs";
import path from "path"; 
import prisma from "../lib/prisma";   

export async function deleteUnusedImages() {
  try {
    // 1. Get all image filenames from DB
    const productImages = await prisma.productImage.findMany({
      select: { url: true }
    });

    const dbFiles = new Set(
      productImages.map(img => path.basename(img.url))
    );

    // 2. Try to find the images directory dynamically
    const possiblePaths = [
      path.join(__dirname, "../../public/images"), // for public/images
      path.join(__dirname, "../images")           // for src/images
    ];


    console.log(__dirname)
    console.log(possiblePaths)



    let imagesDir = null;
    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
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
    const allFiles = fs.readdirSync(imagesDir);

    // 4. Delete unused files
    let deletedCount = 0;
    for (const file of allFiles) {
      if (!dbFiles.has(file)) {
        fs.unlinkSync(path.join(imagesDir, file));
        deletedCount++;
      }
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} unused images.`);
  } catch (error) {
    console.log(error) 
    console.error("❌ Error deleting unused images:", error);
  }
}
