import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createCategory = async (req: Request, res: Response) => {
  const { name} = req.body;
  const user = req.user;
     
  if (!name) {
      console.warn(`Skipping category ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const category = await prisma.category.create({
        data: {
          name, 
        } 
      });

      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ message: "Failed to create category.", error: err });
    }
  };
}



// Get All categorys
export const getAllCategory = async (_req: Request, res: Response) => {
  try {
    const categorys = await prisma.category.findMany({
      include: {subCategories: true}
    });
    res.json(categorys);
  } catch (err:any) { 
  res.status(500).json({
    message: "Failed to fetch categories...",
    error: err.message || err, // show real error in response
  });
  }
};


// Find A categorys
export const findcategory = async (req: Request, res: Response) => {  
  try { 
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id)}, include: {subCategories: true} 
    });
    
    if (!category) {
      return res.status(404).json({ error: "category not found" });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categorys." });
  }
};




// Update category
export const updatecategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name, description, price, stock } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category.", error: err });
  }
};

// Delete category
export const deletecategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    await prisma.category.delete({ where: { id: parseInt(id) } });

    res.json({ message: "category deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category." });
  }
};
