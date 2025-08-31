import { Request, Response } from "express"; 
import prisma from "../lib/prisma";   
import { log } from "console";
//import { log } from "console";
interface MulterFiles {
    images?: Express.Multer.File[];
    videos?: Express.Multer.File[];
}


// Create ImageSlider 
 export const createImageSlider = async (req: Request, res: Response) => {
  try {
    const { category, name, description, longDescription } = req.body;
    const user = req.user;

    if (!user?.id) return res.status(403).json({ message: "Not a user." });
    if (!category || !name) return res.status(400).json({ message: "Category and name are required." });

    // multer.any() puts all files into an array
    const allFiles = (req.files as Express.Multer.File[]) || [];

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

    await prisma.imageSlider.createMany({ data: imagesData });

    const fullImageSlider = await prisma.imageSlider.findMany();
    res.status(201).json(fullImageSlider);
  } catch (err) {
    console.error("Error creating imageslider:", err);
    res.status(500).json({ message: "Failed to create imageslider.", error: err });
  }
};
 

// ✅ Get All ImageSliders
export const getAllImageSlider = async (_req: Request, res: Response) => {
  try {
    const sliders = await prisma.imageSlider.findMany();
    // Don’t add host, keep raw path (frontend will prepend host)
    const withFullUrls = sliders.map((s) => ({
      ...s,
      imageUrl: `${s.imageUrl}`,
    }));

    res.json(withFullUrls);
  } catch (err) {
    console.error("Error fetching image sliders:", err);
    res.status(500).json({ message: "Failed to fetch imagesliders." });
  }
};

// ✅ Get ImageSlider by Category / SubCategory
export const getImageSliderByCategory = async (req: Request, res: Response) => {
  const { categoryId, subCategoryId } = req.query;

  try {
    let where: any = {};
    if (categoryId) where.category = String(categoryId);
    if (subCategoryId) where.subCategory = String(subCategoryId);

    const imagesliders = await prisma.imageSlider.findMany({ where });
    res.json(imagesliders);
  } catch (err) {
    console.error("Error fetching image sliders by category:", err);
    res.status(500).json({ message: "Failed to fetch imagesliders." });
  }
};

// ✅ Find a single ImageSlider
export const findImageSlider = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id) || 0;
    const imageslider = await prisma.imageSlider.findUnique({
      where: { id },
    });

    if (!imageslider) {
      return res.status(404).json({ error: "ImageSlider not found" });
    }
    res.json(imageslider);
  } catch (err) {
    console.error("Error finding image slider:", err);
    res.status(500).json({ message: "Failed to fetch imageslider." });
  }
};

// ✅ Update ImageSlider
export const updateImageSlider = async (req: Request, res: Response) => {
  const { files } = req as Request & { files: MulterFiles };
  const id = Number(req.params.id);

  try {
    const { category, name, shortDescription, longDescription } = req.body;
    const user = req.user;

    if (!user?.id) return res.status(403).json({ message: "Not a user." });

    // Handle uploaded image
    let imageUrl: string | undefined = undefined;
    const imageFiles = files?.images || [];
    if (imageFiles.length > 0) {
      imageUrl = `/uploads/images/slider/images/${imageFiles[0].filename}`;
    }

    const updated = await prisma.imageSlider.update({
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
  } catch (err) {
    console.error("Error updating imageslider:", err);
    res.status(500).json({ message: "Failed to update imageslider.", error: err });
  }
};

// ✅ Delete ImageSlider
export const deleteImageSlider = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user;

  try {
    if (!user?.id && !user?.email?.startsWith("huzaifeeyunus")) {
      return res.status(403).json({ message: "Not authorized." });
    }

    await prisma.imageSlider.delete({ where: { id: parseInt(id) } });
    res.json({ message: "ImageSlider deleted." });
  } catch (err) {
    console.error("Error deleting imageslider:", err);
    res.status(500).json({ message: "Failed to delete imageslider." });
  }
};

