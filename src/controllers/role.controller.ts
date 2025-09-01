import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  



// Create Product
export const createRole = async (req: Request, res: Response) => {
  const { name, description} = req.body;
  const user = req.user;
     
  if (!name) {
      console.warn(`Skipping role ${name} due to missing data`); 
    
  }else{
      
    try { 
 
      const role = await prisma.role.create({
        data: {
          name, description
        } 
      });

      res.status(201).json(role);
    } catch (err) {
      res.status(500).json({ message: "Failed to create role.", error: err });
    }
  };
}



// Get All roles
export const getAllRole = async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch roles." });
  }
};


// Find A roles
export const findRole = async (req: Request, res: Response) => {  
  try { 
    const role = await prisma.role.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!role) {
      return res.status(404).json({ error: "role not found" });
    }
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch roles." });
  }
};




// Update role
export const updateRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { name, description } = req.body;

  try {
    const role = await prisma.role.findUnique({
      where: { id: Number(id) },
    });

    if (!role) return res.status(403).json({ message: "Not a role." });

    const foundrole = await prisma.role.update({
      where: { id: parseInt(id) },
      data: { name, description },
    });

    res.json(foundrole);
  } catch (err) {
    res.status(500).json({ message: "Failed to update role.", error: err });
  }
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user; 

  try {
    const role = await prisma.role.findUnique({
      where: { id: Number(id) },
    });

    if (!role) return res.status(403).json({ message: "Not a role." });

    await prisma.role.delete({ where: { id: parseInt(id) } });

    res.json({ message: "role deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete role." });
  }
};
