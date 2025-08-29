import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createSize = async (req: Request, res: Response) => {
  const { name} = req.body;
  const user = req.user;
     
  if (!name) {
      console.warn(`Skipping size ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const size = await prisma.size.create({
        data: {
          name, 
        } 
      });

      res.status(201).json(size);
    } catch (err) {
      res.status(500).json({ message: "Failed to create size.", error: err });
    }
  };
}



// Get All sizes
export const getAllSize = async (_req: Request, res: Response) => {
  try {
    const sizes = await prisma.size.findMany();
    res.json(sizes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sizes." });
  }
};


// Find A sizes
export const findSize = async (req: Request, res: Response) => {  
  try { 
    const size = await prisma.size.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!size) {
      return res.status(404).json({ error: "size not found" });
    }
    res.json(size);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sizes." });
  }
};




// Update size
export const updateSize = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name, description, price, stock } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    const size = await prisma.size.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(size);
  } catch (err) {
    res.status(500).json({ message: "Failed to update size.", error: err });
  }
};

// Delete size
export const deleteSize = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    await prisma.size.delete({ where: { id: parseInt(id) } });

    res.json({ message: "size deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete size." });
  }
};
