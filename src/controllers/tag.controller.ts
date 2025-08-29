import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createTag = async (req: Request, res: Response) => {
  const { name} = req.body;
  const user = req.user;
     
  if (!name) {
      console.warn(`Skipping tag ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const tag = await prisma.tag.create({
        data: {
          name, 
        } 
      });

      res.status(201).json(tag);
    } catch (err) {
      res.status(500).json({ message: "Failed to create tag.", error: err });
    }
  };
}



// Get All tags
export const getAllTag = async (_req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tags." });
  }
};


// Find A tags
export const findTag = async (req: Request, res: Response) => {  
  try { 
    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!tag) {
      return res.status(404).json({ error: "tag not found" });
    }
    res.json(tag);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tags." });
  }
};




// Update tag
export const updateTag = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name, description, price, stock } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    const tag = await prisma.tag.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(tag);
  } catch (err) {
    res.status(500).json({ message: "Failed to update tag.", error: err });
  }
};

// Delete tag
export const deleteTag = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    await prisma.tag.delete({ where: { id: parseInt(id) } });

    res.json({ message: "tag deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete tag." });
  }
};
