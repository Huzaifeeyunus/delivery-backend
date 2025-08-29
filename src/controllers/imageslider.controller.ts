import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  
import { generateSKU } from "../middlewares/randomnames.middleware"
//import { log } from "console";
interface MulterFiles {
    images?: Express.Multer.File[];
    videos?: Express.Multer.File[];
}


// Create ImageSlider 

export const createImageSlider = async (req: Request, res: Response) => {  
  const { files } = req as Request & { files: MulterFiles };
 
  
  try {
    const {
      category,name, description, longDescription
    } = req.body;

    const user = req.user;
  
 
    if (!user?.id) return res.status(403).json({ message: "Not a user." });
  
 
 
  const imageFiles = files.images || [];
  if (imageFiles.length > 0) {
    const imagesData = imageFiles.map((file) => ({ 
        category,
        name,
        description,
        longDescription, 
        imageUrl: `/uploads/sliders/images/${file.filename}`,
    }));
    await prisma.imageSlider.createMany({ 
      data: imagesData 
    });
  } 
    
    // Step 4 — return full imageslider
   const fullImageSlider = await prisma.imageSlider.findMany();


    res.status(201).json(fullImageSlider);
  } catch (err) {
    console.error("Error creating imageslider:", err);
    res.status(500).json({ message: "Failed to create imageslider.", error: err });
  }
};


// Get All ImageSliders
export const getImageSliders = async (_req: Request, res: Response) => {
  const { categoryId, subCategoryId } = _req.query; 
  try {
    if(categoryId && !subCategoryId){
    const imagesliders = await prisma.imageSlider.findMany();
    res.json(imagesliders);

    }   
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch imagesliders." });
  }
};

// Get All ImageSliders
export const findImageSliderImage = async (_req: Request, res: Response) => {
  try {
    const imagesliderImage = await prisma.imageSlider.findMany({
      where: { id: parseInt(_req.params.id)},
    });
    res.json(imagesliderImage);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch imagesliders." });
  }
};

 
// Find A ImageSliders
export const findImageSlider = async (req: Request, res: Response) => {  
  try { 
      const imageslider = await prisma.imageSlider.findUnique({
        where: { id: parseInt(req.params.id) } 
      });
    
    if (!imageslider) {
      return res.status(404).json({ error: "ImageSlider not found" });
    }
    res.json(imageslider);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch imagesliders." });
  }
};
 


// Update ImageSlider 
 

export const updateImageSlider = async (req: Request, res: Response) => {  
  const { files } = req as Request & { files: MulterFiles };
  
  const id = Number(req.params.id);  
   
  try {
    const {
      category, name, shortDescription, longDescription, 
      // This will be an array from the formData 
    } = req.body;

    const user = req.user; 
  
    if (!user?.id) return res.status(403).json({ message: "Not a user." });
     
// Handle image
const imageFiles = files.videos || [];
if (imageFiles.length > 0) {
  await Promise.all(
    imageFiles.map(file =>
      prisma.imageSlider.create({
        data: {
        category,
        name,
        shortDescription,
        longDescription,
        imageUrl: `/uploads/imagesliders/videos/${file.filename}`,
        },
      })
    )
  );
}




    
    // Step 4 — return full imageslider
   const fullImageSlider = await prisma.imageSlider.findUnique({
  where: { id: id }, 
});


    res.status(201).json(fullImageSlider);
  } catch (err) {
    console.error("Error update imageslider:", err);
    res.status(500).json({ message: "Failed to update imageslider.", error: err });
  }
};

 


// Delete ImageSlider
export const deleteImageSlider = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user; 
  

  try { 
    
    if (!user?.id) {
      if(!user?.email.startsWith("huzaifeeyunus")){ 
        return res.status(403).json({ message: "Not a vendor." });
      }
    }
 
    await prisma.imageSlider.delete({ where: { id: parseInt(id) } });

    res.json({ message: "ImageSlider deleted." });
  } catch (err) {
    console.error("Error update imageslider:", err);
    res.status(500).json({ message: "Failed to delete imageslider." });
  }
};
