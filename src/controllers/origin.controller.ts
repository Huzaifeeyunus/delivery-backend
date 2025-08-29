import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createOrigin = async (req: Request, res: Response) => {
  const { name} = req.body;
  const user = req.user;
     
  if (!name) {
      console.warn(`Skipping origin ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const origin = await prisma.origin.create({
        data: {
          name, 
        } 
      });

      res.status(201).json(origin);
    } catch (err) {
      res.status(500).json({ message: "Failed to create origin.", error: err });
    }
  };
}



// Get All origins
export const getAllOrigin = async (_req: Request, res: Response) => {
  try {
    const origins = await prisma.origin.findMany();
    res.json(origins);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch origins." });
  }
};


// Find A origins
export const findOrigin = async (req: Request, res: Response) => {  
  try { 
    const origin = await prisma.origin.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!origin) {
      return res.status(404).json({ error: "origin not found" });
    }
    res.json(origin);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch origins." });
  }
};




// Update origin
export const updateOrigin = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name, description, price, stock } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    const origin = await prisma.origin.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(origin);
  } catch (err) {
    res.status(500).json({ message: "Failed to update origin.", error: err });
  }
};

// Delete origin
export const deleteOrigin = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    await prisma.origin.delete({ where: { id: parseInt(id) } });

    res.json({ message: "origin deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete origin." });
  }
};
