import { Request, Response } from "express";
import prisma from "../lib/prisma";
import fs from "fs";
import path from "path";
import { createSubAccount } from "../services/paystack.service";
import { json } from "stream/consumers";

// Helper: get uploaded image URLs
const getUploadedImages = (files: Express.Multer.File[] | undefined): string[] => {
  if (!files || files.length === 0) return [];
  return files.map(file => `/uploads/vendors/images/${file.filename}`);
};

// Helper: get uploaded video URLs
const getUploadedVideos = (files: Express.Multer.File[] | undefined): string[] => {
  if (!files || files.length === 0) return [];
  return files.map(file => `/uploads/vendors/videos/${file.filename}`);
};

// -------------------- CREATE VENDOR --------------------
export const createVendor = async (req: Request, res: Response) => {
  const { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude,
    shopAddress, shopEmail, shopWebsite, shopOwner, momoNetwork, momoNumber, isActive } = req.body;
  const userId = Number(req.user?.id);

  if (!shopName) return res.status(400).json({ message: "Shop name is required." });

  try {
    // ✅ Check if user already has a vendor
    const existingVendor = await prisma.vendor.findUnique({ where: { userId } });
    if (existingVendor) {
      return res.status(400).json({ message: "You already have a vendor." });
    }

        // 1. Create Paystack subaccount
    const sub:any = await createSubAccount({
      businessName: shopName,
      bankCode: momoNetwork,   // "MTN", "VOD", "ATL"
      accountNumber: momoNumber,
    });

    const subaccountCode = sub?.data.subaccount_code || "";

    
    // Get uploaded images and videos
    const imageUrls = getUploadedImages(req.files as Express.Multer.File[]);
    const videoUrls = getUploadedVideos(req.files as Express.Multer.File[]);
    const newIsActive = Boolean(isActive) || false;

    // Create vendor with nested images/videos
    const vendor = await prisma.vendor.create({
      data: {
        userId,
        shopName,
        shopPhone,
        shopLocation,
        shopLongitude: shopLongitude ? Number(shopLongitude) : undefined,
        shopLatitude: shopLatitude ? Number(shopLatitude) : undefined,
        shopAddress,
        shopEmail,
        shopWebsite,
        shopOwner,
        subaccountCode,
        isActive: newIsActive,
        images: {
          create: imageUrls.map(url => ({ url })),
        },
        videos: {
          create: videoUrls.map(url => ({ url })),
        },
      },
      include: {
        images: true,
        videos: true,
      },
    });

    res.status(201).json(vendor);
  } catch (err) {
    console.error("Create Vendor Error:", err);
    res.status(500).json({ message: "Failed to create vendor.", error: err });
  }
};

// -------------------- GET ALL VENDORS --------------------
export const getAllVendor = async (_req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: { images: true, videos: true, orders: true },
    });
    res.json(vendors);
  } catch (err) {
    console.error("Get All Vendors Error:", err);
    res.status(500).json({ message: "Failed to fetch vendors.", error: err });
  }
};

// -------------------- GET VENDOR BY ID --------------------
export const findVendor = async (req: Request, res: Response) => {
  let id = Number(req.params.id);
  if(!Number(id)){ id = Number(req.user?.id); } 
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { images: true, videos: true, orders: true },
    });
    if (!vendor) return res.status(404).json({ message: "Vendor not found." });
    res.json(vendor);
  } catch (err) {
    console.error("Find Vendor Error:", err);
    res.status(500).json({ message: "Failed to fetch vendor.", error: err });
  }
};

// -------------------- UPDATE VENDOR --------------------
 
// -------------------- UPDATE VENDOR --------------------
export const updateVendor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude,
    shopAddress, shopEmail, shopWebsite, shopOwner, momoNetwork, momoNumber, isActive } = req.body;

  try {
    // Find existing vendor with images/videos
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
      include: { images: true, videos: true },
    });
    if (!existingVendor) return res.status(404).json({ message: "Vendor not found." });



    try {
      
          const existingsubaccountCode = JSON.parse(existingVendor.subaccountCode || "{}"); 
          const existingmomoNetwork = (existingsubaccountCode.momoNetwork as string) || "";
          const existingmomoNumber = (existingsubaccountCode.momoNumber as string) || ""; 
 
        // 1. Create Paystack subaccount
        if(!existingmomoNetwork || !existingmomoNumber || existingmomoNetwork !== momoNetwork || existingmomoNumber !== momoNumber){          
            const sub:any = await createSubAccount({
            businessName: shopName,
            bankCode: momoNetwork,   // "MTN", "VOD", "ATL"
            accountNumber: momoNumber,
        });

            const subaccountCode = sub?.data.subaccount_code || "";
             await prisma.vendor.update({
              where: { id },
              data: { 
                subaccountCode, 
              }
            });
        }
    } catch (error) {
      
    }

    // Get newly uploaded images/videos
    const newImageUrls = getUploadedImages(req.files as Express.Multer.File[]);
    const newVideoUrls = getUploadedVideos(req.files as Express.Multer.File[]);

    // Update vendor and create new nested images/videos
    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        shopName,
        shopPhone,
        shopLocation,
        shopLongitude: shopLongitude ? Number(shopLongitude) : undefined,
        shopLatitude: shopLatitude ? Number(shopLatitude) : undefined,
        shopAddress,
        shopEmail,
        shopWebsite,
        shopOwner, 
        isActive: Boolean(isActive),
        images: {
          create: newImageUrls.map(url => ({ url })),
        },
        videos: {
          create: newVideoUrls.map(url => ({ url })),
        },
      },
      include: { images: true, videos: true },
    });

    res.json(updatedVendor);
  } catch (err) {
    console.error("Update Vendor Error:", err);
    res.status(500).json({ message: "Failed to update vendor.", error: err });
  }
};

// -------------------- DELETE VENDOR --------------------
export const deleteVendor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { images: true, videos: true },
    });
    if (!vendor) return res.status(404).json({ message: "Vendor not found." });

    // Delete images from disk
    vendor.images.forEach((img: any) => {
      const filePath = path.join(__dirname, "..", img.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    // Delete videos from disk
    vendor.videos.forEach((video: any) => {
      const filePath = path.join(__dirname, "..", video.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await prisma.vendor.delete({ where: { id } });
    res.json({ message: "Vendor deleted." });
  } catch (err) {
    console.error("Delete Vendor Error:", err);
    res.status(500).json({ message: "Failed to delete vendor.", error: err });
  }
};
