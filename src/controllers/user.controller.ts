import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  
import bcrypt from "bcryptjs";
 
// Create User
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, passwordHash, phone, roleIds, imageUrl } = req.body;

    // Validate input
    if (!name || !email || !passwordHash) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    // If no roleIds provided, default to "customer"
    let finalRoleIds: string[] = [];
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      finalRoleIds = roleIds;
    } else {
      // Look up the customer role from DB
      const customerRole = await prisma.role.findUnique({
        where: { name: "customer" },
      });

      if (!customerRole) {
        return res.status(500).json({ message: "Default customer role not found." });
      }
      finalRoleIds = [customerRole.id.toString()];
    }

    // Create user with roles
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        phone,
        imageUrl,
        roles: {
          create: finalRoleIds.map((roleId: any) => ({
            role: { connect: { id: roleId } },
          })),
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    res.json({
      message: "User created successfully.",
      user: newUser,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({
      message: "Failed to create user.",
      error: err instanceof Error ? err.message : err,
    });
  }
};


// Get All Users
export const getAllUser = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: { role: true }, // include role details
        },
      },
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

// Find A User
export const findUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true }, // include role details
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Failed to fetch user." });
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
      include: { roles: true }, // include roles for comparison
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const { name, email, passwordHash, phone, roleIds, imageUrl } = req.body;

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (imageUrl) updateData.imageUrl = imageUrl;

    // Handle password hashing 
    if (passwordHash && passwordHash.trim() !== "") {
      if (!passwordHash.startsWith("$2b$") && !passwordHash.startsWith("$2a$")) {
        // plain text → hash it
        updateData.passwordHash = await bcrypt.hash(passwordHash, 10);
      } else {
        // already hashed → keep as is
        updateData.passwordHash = passwordHash;
      }
    }

    // Handle roles (many-to-many through UserRole)
    if (Array.isArray(roleIds)) {
      updateData.roles = {
        deleteMany: {}, // remove all existing UserRole entries
        create: roleIds.map((roleId: string) => ({
          role: { connect: { id: roleId } },
        })),
      };
    }

      const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData, // ✅ now using the built object
      include: {
        roles: { include: { role: true } },
      },
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
