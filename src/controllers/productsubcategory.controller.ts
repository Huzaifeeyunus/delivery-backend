import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createSubCategory = async (req: Request, res: Response) => {
  const { name, categoryId} = req.body;
  const user = req.user;
  const newCategoryId = Number(categoryId);
     console.log(name, newCategoryId)
  if (!name) {
      console.warn(`Skipping subCategory ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const subCategory = await prisma.subCategory.create({
        data: {
          name,
          categoryId: newCategoryId, 
        } 
      });

      res.status(201).json(subCategory);
    } catch (err) {
      res.status(500).json({ message: "Failed to create subCategory.", error: err });
    }
  };
}



// Get All subCategory
export const getAllsubCategory = async (_req: Request, res: Response) => {
  try {
    const subCategories = await prisma.subCategory.findMany({
    include: { category: true }, // <-- include related category
  });
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subCategories." });
  }
};


// Get All subCategory
export const findSubCategoryByCategory = async (_req: Request, res: Response) => {
  try {
    const _Category = await prisma.category.findUnique({
      where: { id: parseInt(_req.params.categoryid)} 
    });

    if(_Category != null){ 
      const subCategories = await prisma.subCategory.findMany({
        where:{categoryId: _Category?.id}, 
        include: { category: true },  
      });
      res.json(subCategories);
    }else{ 
      res.json();
    }

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subCategories." });
  }
};

// Find A subCategories
export const findSubCategory = async (req: Request, res: Response) => {  
  try { 
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(req.params.id)} , 
        include: { category: true },  
    });
    
    if (!subCategory) {
      return res.status(404).json({ error: "subCategory not found" });
    }
    res.json(subCategory);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subCategories." });
  }
};




// Update subCategories
export const updateSubCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    const subCategories = await prisma.subCategory.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ message: "Failed to update subCategory.", error: err });
  }
};

// Delete category
export const deleteSubCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  try { 
 

    await prisma.subCategory.delete({ where: { id: parseInt(id) } });

    res.json({ message: "subCategory deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete subCategory." });
  }
};
