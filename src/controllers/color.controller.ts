import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createColor = async (req: Request, res: Response) => {
  const { name} = req.body;
  const user = req.user;
     
  if (!name) {
      console.warn(`Skipping color ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const color = await prisma.color.create({
        data: {
          name, 
        } 
      });

      res.status(201).json(color);
    } catch (err) {
      res.status(500).json({ message: "Failed to create color.", error: err });
    }
  };
}



// Get All colors
export const getAllColor = async (_req: Request, res: Response) => {
  try {
    const colors = await prisma.color.findMany();
    res.json(colors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch colors." });
  }
};


// Find A colors
export const findColor = async (req: Request, res: Response) => {  
  try { 
    const color = await prisma.color.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!color) {
      return res.status(404).json({ error: "color not found" });
    }
    res.json(color);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch colors." });
  }
};




// Update color
export const updateColor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name, description, price, stock } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    const color = await prisma.color.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(color);
  } catch (err) {
    res.status(500).json({ message: "Failed to update color.", error: err });
  }
};

// Delete color
export const deleteColor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    await prisma.color.delete({ where: { id: parseInt(id) } });

    res.json({ message: "color deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete color." });
  }
};
