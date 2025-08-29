import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  
import bcrypt from "bcryptjs";
 

// Create Product
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({ message: "Invalid user ID." });
    }
 
 

    const { name, email, passwordHash, phone, role, imageUrl } = req.body;

    // Prepare update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = "customer";
     updateData.role = "customer";
    if (imageUrl) updateData.imageUrl = imageUrl;

    // Hash password only if provided and changed
      if (passwordHash && passwordHash.trim() !== "") {
        const hashedPassword = await bcrypt.hash(passwordHash, 10);
        updateData.passwordHash = hashedPassword;
        console.log("Password changed")
      }
    const updatedUser = await prisma.user.create({ 
      data: updateData,
    });

    res.json({
      message: "User created successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({
      message: "Failed to create user.",
      error: err instanceof Error ? err.message : err,
    });
  }
}



// Get All users
export const getAllUser = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
};


// Find A users
export const findUser = async (req: Request, res: Response) => {  
  try { 
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
};




// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const { name, email, passwordHash, phone, role, imageUrl } = req.body;

    // Prepare update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (imageUrl) updateData.imageUrl = imageUrl;

    // Hash password only if provided and changed
    
    if(!passwordHash.includes("$2b")){  
      if (passwordHash && passwordHash.trim() !== "") {
        const hashedPassword = await bcrypt.hash(passwordHash, 10);
        updateData.passwordHash = hashedPassword;
        console.log("Has changed__: ",updateData)
      } 
    }
 
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({
      message: "Failed to update user.",
      error: err instanceof Error ? err.message : err,
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = req.user;

  try {
    const _user = await prisma.user.findUnique({
      where: { id },
    });

    if (!_user) return res.status(403).json({ message: "Not a user." });

    await prisma.user.delete({ where: { id: id } });

    res.json({ message: "user deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user." });
  }
};
