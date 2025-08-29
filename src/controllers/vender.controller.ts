import { Request, Response } from "express"; 
import prisma from "../lib/prisma"; 
  
 
// Create Product 
export const createVendor = async (req: Request, res: Response) => {
  const { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude, 
    shopAddress, shopEmail, shopWebsite, shopOwner, isActive} = req.body;
  const userId = Number(req.user?.id);

     
  if (!shopName) {
      console.warn(`Skipping vendor ${shopName} due to missing data`); 
    
  }else{
    try { 
 
      console.log(req.body)
      const newIsActive: boolean = Boolean(isActive) || false
      const vendor = await prisma.vendor.create({
        data: {
          userId,
          shopName, shopPhone, shopLocation, shopLongitude, shopLatitude, 
            shopAddress, shopEmail, shopWebsite, shopOwner, isActive: newIsActive, 
        } 
      });

      res.status(201).json(vendor);
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: "Failed to create vendor.", error: err });
    }
  };
}



// Get All vendors
export const getAllVendor = async (_req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendors." });
  }
};


// Find A vendors
export const findVendor = async (req: Request, res: Response) => {  
  try { 
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(req.params.id)} 
    });
    
    if (!vendor) {
      return res.status(404).json({ error: "vendor not found" });
    }
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendors." });
  }
};




// Update vendor
export const updateVendor = async (req: Request, res: Response) => { 
  const { shopName, shopPhone, shopLocation, shopLongitude, shopLatitude, 
    shopAddress, shopEmail, shopWebsite, shopOwner, isActive} = req.body;

  const id = Number(req.params); 
  const userId = Number(req.user);
  const { name, description, price, stock } = req.body;

  try {
    const _vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!_vendor) return res.status(403).json({ message: "Not a vendor." });

    const updated_vendor = await prisma.vendor.update({
      where: { id: id },
      data: {  shopName, shopPhone, shopLocation, shopLongitude, shopLatitude, 
                shopAddress, shopEmail, shopWebsite, shopOwner, isActive },
    });

    res.json(updated_vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to update vendor.", error: err });
  }
};

// Delete vendor
export const deleteVendor = async (req: Request, res: Response) => {
  const id = Number(req.params);
  const userId = Number(req.user);

  try {
    const _vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!_vendor) return res.status(403).json({ message: "Not a vendor." });

    await prisma.vendor.delete({ where: { id: id } });

    res.json({ message: "vendor deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete vendor." });
  }
};
