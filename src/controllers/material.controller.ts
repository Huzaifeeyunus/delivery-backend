import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createMaterial = async (req: Request, res: Response) => {
  const { name} = req.body;
  const user = req.user;
     
  if (!name) {
      console.warn(`Skipping material ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const material = await prisma.material.create({
        data: {
          name, 
        } 
      });

      res.status(201).json(material);
    } catch (err) {
      res.status(500).json({ message: "Failed to create material.", error: err });
    }
  };
}



// Get All materials
export const getAllMaterial = async (_req: Request, res: Response) => {
  try {
    const materials = await prisma.material.findMany();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch materials." });
  }
};


// Find A materials
export const findMaterial = async (req: Request, res: Response) => {  
  try { 
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!material) {
      return res.status(404).json({ error: "material not found" });
    }
    res.json(material);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch materials." });
  }
};




// Update material
export const updateMaterial = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name, description, price, stock } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    const material = await prisma.material.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(material);
  } catch (err) {
    res.status(500).json({ message: "Failed to update material.", error: err });
  }
};

// Delete material
export const deleteMaterial = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    await prisma.material.delete({ where: { id: parseInt(id) } });

    res.json({ message: "material deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete material." });
  }
};
