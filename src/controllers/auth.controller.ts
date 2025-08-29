// src/controllers/auth.controller.ts
import { Request, Response, NextFunction  } from "express";
import prisma from "../lib/prisma";
import { hashPassword } from "../utils/hash";
import { generateToken, signToken } from "../utils/jwt";

 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; 
import { log } from "console";


declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; }; // extend as needed
    }
  }
}
 

 

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user) return res.status(401).json({ error: "User not found" });

      (req as any).user = user; // ✅ attach user to request
       
      return next();
    } catch (err) {
      console.error("JWT error:", err);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ error: "Not authorized, no token" });
};




export const register = async (req: Request, res: Response) => {
  const { name, email, password, phone, shopName,shopPhone,shopLocation, shopAddress } = req.body;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    const role = "customer";
    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role,
        passwordHash,
      },
    });

    // If vendor, create vendor profile
    const vrole: string = "customer";
    if (vrole === "vendor") {
      if (!shopName || !shopAddress) {
        return res.status(400).json({ message: "Vendor must provide shop name and address" });
      }

      await prisma.vendor.create({
        data: {
          userId: user.id,
          shopName,
          shopPhone,
          shopLocation,
          shopAddress,
        },
      });
    }

    const token = generateToken({ id: user.id, name: user.name, email: user.email, role: user.role });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};





 

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const loginuser = await prisma.user.findUnique({ where: { email } });

  if (!loginuser) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isMatch = await bcrypt.compare(password, loginuser.passwordHash);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = jwt.sign({ id: loginuser.id, name: loginuser.name, email: loginuser.email, role: loginuser.role }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

  res.status(200).json({
    token,
    user: {
      id: loginuser.id,
      name: loginuser.name,
      email: loginuser.email,
      role: loginuser.role,
    },
  });
};



 

// Token blacklist (in-memory for now; replace with Redis/DB for persistence)
let tokenBlacklist: string[] = [];
// Logout Controller
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Add token to blacklist (this only works until server restarts; use Redis/DB for production)
    tokenBlacklist.push(token);
    res.clearCookie('token'); // or your session cookie
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

