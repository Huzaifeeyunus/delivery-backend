// src/controllers/auth.controller.ts
import { Request, Response, NextFunction  } from "express";
import prisma from "../lib/prisma";
import { hashPassword } from "../utils/hash";
import { generateToken, signToken } from "../utils/jwt";
import crypto from "crypto";
 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; 
import { log } from "console";
import { type Role } from "@prisma/client";
// Add this import at the top of your auth.controller.ts
import axios from "axios";






/* 
 type Role = {
  id: number;
  name: string;
  description: string | null;
}; */
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; role: Role }; // extend as needed
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
  const {
    name,
    email,
    password,
    phone,
    shopName,
    shopPhone,
    shopLocation,
    shopAddress,
    licenseNumber,
    vehicleType,
    vehiclePlate,
    agentAddress,
          nationalId, 
          dateOfBirth, 
          emergencyContactName, 
          emergencyContactPhone, 
          region,
    type = "customer", // default
  } = req.body;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
 
    // Decide role
    let role = "customer";
    if (type === "vendor") role = "vendor";
    if (type === "delivery") role = "delivery";
    //const userroles:any = await prisma.role.findUnique({where: {name: role.toLowerCase()}});
 


    // Create user (vendors & delivery start as inactive)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role, 
        passwordHash,
        //isActive: role === "customer", // only customers active immediately
      },
    });



    
    // If vendor, create vendor profile
    if (role === "vendor") {
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
          isActive: false, // pending admin approval
        },
      });
    }

    // If delivery, create delivery profile
    if (role === "delivery") {
      if (!licenseNumber || !vehicleType || !vehiclePlate || !agentAddress) {
        return res.status(400).json({ message: "Delivery agent must provide full details" });
      }

      await prisma.deliveryAgent.create({
        data: {
          userId: user.id,
          licenseNumber,
          vehicleType,
          vehiclePlate,
          agentAddress,
          nationalId, 
          dateOfBirth, 
          emergencyContactName, 
          emergencyContactPhone, 
          region,
          isActive: false, // pending admin approval
        },
      });
    }

    // Generate token (customers only; vendors & delivery must wait for approval)
    const token =
      role === "customer"
        ? generateToken({
            id: user.id,
            name: user.name,
            email: user.email,
            role,
          })
        : null;

    res.status(201).json({
      message:
        role === "customer"
          ? "User registered successfully"
          : "Registration submitted, pending admin approval",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role, 
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// New function specifically for registration verification
 // New function specifically for registration verification
export const verifyAndRegister = async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    phone,
    verificationCode,
    gender,
    shopName,
    shopPhone,
    shopLocation,
    shopAddress,
    licenseNumber,
    vehicleType,
    vehiclePlate,
    agentAddress,
    nationalId, 
    dateOfBirth, 
    emergencyContactName, 
    emergencyContactPhone, 
    region,
    type = "customer",
  } = req.body;

  try {
    // 1. First verify the code WITHOUT checking if user exists
    const identifier = phone || email;
    const storedData = verificationCodes.get(identifier);

    if (!storedData) {
      return res.status(400).json({ message: "No verification code found" });
    }

    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(identifier);
      return res.status(400).json({ message: "Verification code has expired" });
    }

    if (storedData.code !== verificationCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // 2. Clean up verification code
    verificationCodes.delete(identifier);

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 4. Hash password
    const passwordHash = await hashPassword(password);
 
    // 5. Determine role
    let role = "customer";
    if (type === "vendor") role = "vendor";
    if (type === "delivery") role = "delivery";

    // 6. Find or create role in Role table
    let roleRecord = await prisma.role.findUnique({ 
      where: { name: role.toLowerCase() } 
    });
    
    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: {
          name: role.toLowerCase(),
          description: `${role} role`
        }
      });
    }

    // 7. Create user WITH UserRole entry
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role,
        gender,
        passwordHash,
        roles: {
          create: {
            roleId: roleRecord.id
          }
        }
      }
    });

    // 8. If vendor, create vendor profile
    if (role === "vendor") {
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
          isActive: false,
        },
      });
    }

    // 9. If delivery, create delivery profile
    if (role === "delivery") {
      if (!licenseNumber || !vehicleType || !vehiclePlate || !agentAddress) {
        return res.status(400).json({ message: "Delivery agent must provide full details" });
      }

      await prisma.deliveryAgent.create({
        data: {
          userId: user.id,
          licenseNumber,
          vehicleType,
          vehiclePlate,
          agentAddress,
          nationalId, 
          dateOfBirth, 
          emergencyContactName, 
          emergencyContactPhone, 
          region,
          isActive: false,
        },
      });
    }

    // 10. Generate token (always generate token for registration)
    const token = jwt.sign({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: role 
    }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
      },
    });
  } catch (error) {
    console.error("Verify and register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};


 

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const loginuser = await prisma.user.findUnique({ where: { email }, include: {roles: true} });

  if (!loginuser) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isMatch = await bcrypt.compare(password, loginuser.passwordHash);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

   const roles = await prisma.role.findUnique({where: {id: loginuser.roles?.[0].roleId}});
   
  const token = jwt.sign({ id: loginuser.id, name: loginuser.name, email: loginuser.email, role:  roles}, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

  res.status(200).json({
    token,
    user: {
      id: loginuser.id,
      name: loginuser.name,
      email: loginuser.email,
      role: roles,
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





 
// Middleware to check if verification code is valid 

// Update the sendVerificationCode function - replace the SMS part:
 
// Store verification codes (use Redis in production)
const verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

// Generate random 6-digit code
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};



// Send verification code  

const sendMtotifySMS = async (phone: string, message: string) => {
  try {
    console.log('Sending SMS to:', phone);
    
    const endPoint = 'https://api.mnotify.com/api/sms/quick';
    const apiKey = process.env.MTOTIFY_API_KEY;
    const url = endPoint + '?key=' + apiKey;

    const data = {
      recipient: [phone], // Must be an array
      sender: 'Rash4short', // Your approved sender ID
      message: message,
      is_schedule: false,
      schedule_date: '',
      // Remove sms_type for regular messages
    };

    console.log('Mnotify v2 request:', { url, data: { ...data, recipient: '[REDACTED]' } });

    const response = await axios.post(url, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Mnotify v2 response:', response.data);
    const responseData : any = response.data;
    if (responseData && responseData.status === 'success') {
      return response.data;
    } else {
      throw new Error(responseData.message || 'SMS sending failed');
    }
  } catch (error: any) {
    console.error('Mnotify v2 SMS error:');
    console.error('Error message:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    
    throw new Error(error.response?.data?.message || 'Failed to send SMS');
  }
};

//---------------------------------------------------------
//---------------------------------------------------------
// Add email verification function
const sendEmailVerification = async (email: string, code: string) => {
  try {
    // You can use nodemailer, SendGrid, or any email service
    console.log(`Email verification code for ${email}: ${code}`);
    
    // Example with nodemailer (you'll need to set this up)
    /*
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Rash4short Verification Code',
      html: `
        <div>
          <h2>Rash4short Verification</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });
    */
    
    return true;
  } catch (error) {
    console.error('Email verification error:', error);
    throw new Error('Failed to send email verification');
  }
};

// Update the sendVerificationCode function to handle both
 
export const sendVerificationCode = async (req: Request, res: Response) => {
  const { phone, email, verificationMethod = 'both' } = req.body;

  if (!phone || !email) {
    return res.status(400).json({ message: "Phone and email are required" });
  }

  try {
    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code for both phone and email
    verificationCodes.set(phone, { code, expiresAt });
    verificationCodes.set(email, { code, expiresAt });

    const deliveryMethods = [];

    // Send SMS if requested
    if (verificationMethod === 'both' || verificationMethod === 'phone') {
      try {
        const smsMessage = `Your Rash4short verification code is: ${code}. Valid for 10 minutes.`;
        await sendMtotifySMS(phone, smsMessage);
        deliveryMethods.push('sms');
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        // Don't fail the whole request if SMS fails
      }
    }

    // Send Email if requested
    if (verificationMethod === 'both' || verificationMethod === 'email') {
      try {
        await sendEmailVerification(email, code);
        deliveryMethods.push('email');
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    res.json({ 
      message: "Verification codes sent successfully",
      deliveryMethods: deliveryMethods
    });
  } catch (error) {
    console.error("Send verification code error:", error);
    res.status(500).json({ 
      message: "Failed to send verification codes",
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
// Update verifyCodeAndLogin to accept either phone or email
export const verifyCodeAndLogin = async (req: Request, res: Response) => {
  const { phone, email, code } = req.body;

  if (!code || (!phone && !email)) {
    return res.status(400).json({ message: "Code and either phone or email are required" });
  }

  try {
    const identifier = phone || email;
    const storedData = verificationCodes.get(identifier);

    if (!storedData) {
      return res.status(400).json({ message: "No verification code found" });
    }

    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(identifier);
      return res.status(400).json({ message: "Verification code has expired" });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Code is valid - get user and login
    const user = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { phone: phone || undefined },
          { email: email || undefined }
        ]
      },
      include: { roles: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roles = await prisma.role.findUnique({ 
      where: { id: user.roles?.[0].roleId } 
    });

    const token = jwt.sign({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: roles 
    }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    // Clean up used codes
    verificationCodes.delete(phone || '');
    verificationCodes.delete(email || '');

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roles,
      },
    });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};