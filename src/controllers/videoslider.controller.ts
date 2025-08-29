import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  
import { generateSKU } from "../middlewares/randomnames.middleware"
//import { log } from "console";
interface MulterFiles { 
    videos?: Express.Multer.File[];
}


// Create VideoSlider 

export const createVideoSlider = async (req: Request, res: Response) => {  
  const { files } = req as Request & { files: MulterFiles };
 
  
  try {
    const {
      category,name, description, longDescription
    } = req.body;

    const user = req.user;
  
 
    if (!user?.id) return res.status(403).json({ message: "Not a user." });
  
 
 
  const videoFiles = files.videos || [];
  if (videoFiles.length > 0) {
    const videosData = videoFiles.map((file) => ({ 
        category,
        name,
        description,
        longDescription, 
        videoUrl: `/uploads/sliders/videos/${file.filename}`,
    }));
    await prisma.videoSlider.createMany({ 
      data: videosData 
    });
  } 
    
    // Step 4 — return full videoslider
   const fullVideoSlider = await prisma.videoSlider.findMany();


    res.status(201).json(fullVideoSlider);
  } catch (err) {
    console.error("Error creating videoslider:", err);
    res.status(500).json({ message: "Failed to create videoslider.", error: err });
  }
};


// Get All VideoSliders
export const getVideoSliders = async (_req: Request, res: Response) => {
  const { categoryId, subCategoryId } = _req.query; 
  try {
    if(categoryId && !subCategoryId){
    const videosliders = await prisma.videoSlider.findMany();
    res.json(videosliders);

    }   
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videosliders." });
  }
};

// Get All VideoSliders
export const findVideoSliderVideo = async (_req: Request, res: Response) => {
  try {
    const videosliderVideo = await prisma.videoSlider.findMany({
      where: { id: parseInt(_req.params.id)},
    });
    res.json(videosliderVideo);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videosliders." });
  }
};

 
// Find A VideoSliders
export const findVideoSlider = async (req: Request, res: Response) => {  
  try { 
      const videoslider = await prisma.videoSlider.findUnique({
        where: { id: parseInt(req.params.id) } 
      });
    
    if (!videoslider) {
      return res.status(404).json({ error: "VideoSlider not found" });
    }
    res.json(videoslider);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videosliders." });
  }
};
 


// Update VideoSlider 
 

export const updateVideoSlider = async (req: Request, res: Response) => {  
  const { files } = req as Request & { files: MulterFiles };
  
  const id = Number(req.params.id);  
   
  try {
    const {
      category, name, shortDescription, longDescription, 
    } = req.body;

    const user = req.user; 
  
    if (!user?.id) return res.status(403).json({ message: "Not a user." });
     
// Handle video
const videoFiles = files.videos || [];
if (videoFiles.length > 0) {
  await Promise.all(
    videoFiles.map(file =>
      prisma.videoSlider.create({
        data: {
        category,
        name,
        shortDescription,
        longDescription,
        videoUrl: `/uploads/videosliders/videos/${file.filename}`,
        },
      })
    )
  );
}




    
    // Step 4 — return full videoslider
   const fullVideoSlider = await prisma.videoSlider.findUnique({
  where: { id: id }, 
});


    res.status(201).json(fullVideoSlider);
  } catch (err) {
    console.error("Error update videoslider:", err);
    res.status(500).json({ message: "Failed to update videoslider.", error: err });
  }
};

 


// Delete VideoSlider
export const deleteVideoSlider = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user; 
  

  try { 
    
    if (!user?.id) {
      if(!user?.email.startsWith("huzaifeeyunus")){ 
        return res.status(403).json({ message: "Not a vendor." });
      }
    }
 
    await prisma.videoSlider.delete({ where: { id: parseInt(id) } });

    res.json({ message: "VideoSlider deleted." });
  } catch (err) {
    console.error("Error update videoslider:", err);
    res.status(500).json({ message: "Failed to delete videoslider." });
  }
};
