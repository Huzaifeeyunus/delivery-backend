import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createBrand = async (req: Request, res: Response) => {
  const { name} = req.body;
  const user = req.user;
     
  if (!name) {
      console.warn(`Skipping brand ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const brand = await prisma.brand.create({
        data: {
          name, 
        } 
      });

      res.status(201).json(brand);
    } catch (err) {
      res.status(500).json({ message: "Failed to create brand.", error: err });
    }
  };
}



// Get All brands
export const getAllBrand = async (_req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch brands." });
  }
};


// Find A brands
export const findBrand = async (req: Request, res: Response) => {  
  try { 
    const brand = await prisma.brand.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!brand) {
      return res.status(404).json({ error: "brand not found" });
    }
    res.json(brand);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch brands." });
  }
};




// Update brand
export const updateBrand = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name, description, price, stock } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    const brand = await prisma.brand.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(brand);
  } catch (err) {
    res.status(500).json({ message: "Failed to update brand.", error: err });
  }
};

// Delete brand
export const deleteBrand = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    await prisma.brand.delete({ where: { id: parseInt(id) } });

    res.json({ message: "brand deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete brand." });
  }
};
