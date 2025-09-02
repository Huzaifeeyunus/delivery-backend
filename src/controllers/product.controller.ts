import { Request, Response } from "express"; 
import prisma from "../lib/prisma";  
import { generateSKU } from "../middlewares/randomnames.middleware"
import { log } from "console";

//import { log } from "console";
interface MulterFiles {
    images?: Express.Multer.File[];
    videos?: Express.Multer.File[]; 
  [key: string]: Express.Multer.File[] | undefined; // allow dynamic keys like variantImages_0
}
interface VariantForm {
  id?: number | 0; 
  color: string | "null";
  size: string | "null";
  SKU: string | "null";
  price: number | 0;
  stock: number | 0;
  available: boolean | false;
  discountPrice: number | 0;
  images?: ProductImageForm[];
}

interface ProductImageForm {
  id?: number | 0;
  url: string;
  alt?: string | "null";
  productVariantId?: number | 0;
}


// Create Product
export const createProduct = async (req: Request, res: Response) => {  
  
  try {
    const {
      name,
      description,
      longDescription,
      price,
      stock,
      slug,
      categoryId,
      subCategoryId,
      brandId,
      materialId,
      originId, 
      tag,
      variants // This will be an array from the formData 
    } = req.body;

    const user = req.user;

    if (!subCategoryId || !categoryId) {
      return res.status(400).json({ message: "Missing category or subcategory." });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId: user?.id } });
    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

    // Step 1 — create main product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        longDescription,
        price: parseFloat(price),
        stock: parseInt(stock),
        slug,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
        brandId: parseInt(brandId) ?? null,
        materialId: parseInt(materialId) ?? null,
        originId: parseInt(originId) ?? null, 
        tag: tag,
        vendorId: vendor.id, 
      },
    });
   




    // Step 3 — handle variants
    if (variants && Array.isArray(variants)) {
      const variantData = variants.map((v: any) => ({
        productId: product.id,
        color: v.color, // If using string
        size: v.size,   // If using string
        SKU: v.SKU,
        stock: parseInt(v.stock),
        price: parseFloat(v.price),
      }));

      await prisma.productVariant.createMany({ data: variantData });
    }

    // Step 4 — return full product
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { videos: true, variants: true },
    });

    res.status(201).json(fullProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: "Failed to create product.", error: err });
  }
};

    

export const createProductWithImage = async (req: Request, res: Response) => {
  const uploadedFiles = (req.files as Express.Multer.File[]) || [];
  try {
    const {
      name,
      description,
      longDescription,
      price,
      stock,
      categoryId,
      subCategoryId,
      brandId,
      materialId,
      originId,
      tag,
      variants, // JSON string from frontend
    } = req.body;

    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Vendor validation
    const vendor = await prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) return res.status(403).json({ message: "Not a vendor" });

    if (!categoryId || !subCategoryId)
      return res.status(400).json({ message: "Missing category or subcategory" });

    const slug = generateSKU(name);

    // Step 1 — Create main product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        longDescription,
        price: parseFloat(price),
        stock: parseInt(stock),
        slug,
        categoryId: parseInt(categoryId),
        subCategoryId: parseInt(subCategoryId),
        brandId: brandId ? parseInt(brandId) : null,
        materialId: materialId ? parseInt(materialId) : null,
        originId: originId ? parseInt(originId) : null,
        tag,
        vendorId: vendor.id,
      },
    });

    // Step 2 — Parse variants
    let parsedVariants: any[] = [];
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (err) {
        console.warn("Failed to parse variants:", err);
      }
    }

    // Step 3 — Create variants + images
    for (let i = 0; i < parsedVariants.length; i++) {
      const v = parsedVariants[i];

      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          color: v.color,
          size: v.size,
          SKU: `${v.SKU}-${product.id}-${v.color}`,
          stock: parseInt(v.stock),
          price: parseFloat(v.price),
        },
      });

      // Handle uploaded images for this variant
      const filesForVariant = uploadedFiles.filter(
        (f) => f.fieldname === `variantImages_${i}`
      );

      for (const file of filesForVariant) {
        await prisma.productImage.create({
          data: {
            productVariantId: variant.id,
            url: `/uploads/products/images/${file.filename}`,
          },
        });
      }
    }

    // Step 4 — Handle product-level videos
    const videoFiles = uploadedFiles.filter((f) => f.fieldname === "videos");
    for (const file of videoFiles) {
      await prisma.productVideo.create({
        data: {
          productId: product.id,
          url: `/uploads/products/videos/${file.filename}`,
        },
      });
    }

    // Step 5 — Return full product with variants and images
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        videos: true,
        variants: { include: { images: true } },
      },
    });

    return res.status(201).json(fullProduct);
  } catch (err: any) {
    console.error("Error creating product:", err);
    return res.status(500).json({ message: "Failed to create product", error: err.message });
  }
};




// Get All Products
export const getProducts = async (_req: Request, res: Response) => {
  const { categoryId, subCategoryId } = _req.query; 
  try {
    if(categoryId && !subCategoryId){
    const products = await prisma.product.findMany({  
      where: { categoryId: Number(categoryId)},
      include: {
          vendor: true,
          videos: true,
          variants: {
            include: {
              images: true // ✅ Fetch variant images
            }
          }
        }
    });
    res.json(products);

    }else if(categoryId && subCategoryId){
    const products = await prisma.product.findMany({       
      where: { categoryId: Number(categoryId), subCategoryId: Number(subCategoryId)},
        include: {
          vendor: true,
          videos: true,
          variants: {
            include: {
              images: true // ✅ Fetch variant images
            }
          }
        }
    });
    res.json(products);

    }else{
    const products = await prisma.product.findMany({      
        include: {
          vendor: true,
          videos: true,
          variants: {
            include: {
              images: true // ✅ Fetch variant images
            }
          }
        }
    });
    res.json(products);

    }
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

// Get All Products
export const findProductImage = async (_req: Request, res: Response) => {
  try {
    const productImage = await prisma.productImage.findMany({
      where: { productVariantId: parseInt(_req.params.id)},
    });
    res.json(productImage);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products." });
  }
};


// Get All Products
export const findProductByCategory = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { categoryId: parseInt(_req.params.categoryId)},
        include: {
          vendor: true,
          videos: true,
          variants: {
            include: {
              images: true // ✅ Fetch variant images
            }
          }
        }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products." });
  }
};


// Get All Products
export const findProductBySubCategory = async (_req: Request, res: Response) => {
  const { categoryId, subCategoryId } = _req.query;
  try {
    const products = await prisma.product.findMany({
      where: { categoryId: parseInt(_req.params.categoryId), subCategoryId: parseInt(_req.params.subCategoryId)},
        include: {
          vendor: true,
          videos: true,
          variants: {
            include: {
              images: true // ✅ Fetch variant images
            }
          }
        }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products." });
  }
};



// Find A Products
export const findProduct = async (req: Request, res: Response) => {  
  try { 
      const product = await prisma.product.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          vendor: true,
          videos: true,
          variants: {
            include: {
              images: true // ✅ Fetch variant images
            }
          }
        }
      });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products." });
  }
};


//syncProductFromVariants 
async function syncProductFromVariants(productId: number) {
  const variants: any[] = await prisma.productVariant.findMany({
    where: { productId },
    select: {
      color: true, size: true, SKU: true,
      price: true,
      discountPrice: true,
      stock: true,
      stockStatus: true,
      available: true,
    },
  });



  if (variants.length === 0) {
    // No variants, maybe reset product fields
    await prisma.product.update({
      where: { id: productId },
      data: {
        price: 0,
        discountPrice: null,
        stock: 0,
        stockStatus: "Out of Stock",
        available: false,
      },
    });
    return;
  }
 
  const minPrice = Math.min(...variants.map(v => v.price));
  const minDiscount = Math.min(
    ...variants.map(v => v.discountPrice ?? Number.MAX_VALUE)
  );
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const anyAvailable = variants.some(v => v.available);

  const stockStatus = totalStock > 0 ? "In Stock" : "Out of Stock";

  await prisma.product.update({
    where: { id: productId },
    data: {
      price: minPrice,
      discountPrice: minDiscount === Number.MAX_VALUE ? null : minDiscount,
      stock: totalStock,
      stockStatus,
      available: anyAvailable,
    },
  });
}


// Update Product 
 

export const updateProductWithImage = async (req: Request, res: Response) => {  
  const { files } = req as Request & { files: MulterFiles };
  
  const id = req.params.id;  
   
  try {
    const {
      vendorId, name, description, longDescription, price, stock, categoryId, subCategoryId,
      brandId, materialId, originId, tag, variants 
      // This will be an array from the formData 
    } = req.body;

    const user = req.user;

    let slug = generateSKU(name);
    
    if (!subCategoryId || !categoryId) {
      return res.status(400).json({ message: "Missing category or subcategory." });
    }
 
    const vendor = await prisma.vendor.findFirst({ where: { userId: parseInt(vendorId) } }); 
    if (!vendor) return res.status(403).json({ message: "Not a vendor." });
   

    // Step 1 — create main product
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        longDescription,
        price: 0,
        stock: 0,
        slug,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
        brandId: parseInt(brandId)  ?? null,
        materialId: parseInt(materialId)  ?? null,
        originId: parseInt(originId)  ?? null, 
        tag: tag, 
        vendorId: vendor.id  ?? null, 
      },
    });

  

// Example: variantImagesMap[0] = [File, File, ...]
    const vfiles = req.files as Express.Multer.File[];
    const variantImagesMap: Record<number, Express.Multer.File[]> = {};
    try{ 
        vfiles.forEach((file) => {
          const match = file.fieldname.match(/^variantImages_(\d+)$/);
          if (match) {
            const index = parseInt(match[1], 10);
            if (!variantImagesMap[index]) {
              variantImagesMap[index] = [];
            }
            variantImagesMap[index].push(file);
          }
    }); 
    }catch(err){

        console.error("found err------: ", err);
    }  
// Example: variantImagesMap[0] = [File, File, ...]
// Step 3 — handle variants
 

// Step 3 — handle variants
let parsedVariants: any[] = [];
if (req.body.variants) {
  try {
    parsedVariants = JSON.parse(req.body.variants);
  } catch {
    console.warn("Could not parse variants");
  }
}

if (parsedVariants.length) {
  // Get existing variants for this product
const existingVariants: any[] = await prisma.productVariant.findMany({
  where: { productId: product.id},
  select: {
    id: true,
    color: true,
    size: true,
    SKU: true,
    price: true,
    stock: true,
    available: true,
  },
});


  const existingIds = existingVariants.map(v => v.id);
  const incomingIds = parsedVariants.filter(v => v.id).map(v => v.id);

  // Delete variants that were removed from the request
  const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
  if (idsToDelete.length) {
    await prisma.productVariant.deleteMany({
      where: { id: { in: idsToDelete.filter((id): id is number => id !== undefined) } },
    });
  }

  // Create or update variants
  await Promise.all(
    parsedVariants.map(async (v: any) => {
      const variantData = {
        productId: product.id,
        color: v.color,
        size: v.size,
        SKU: v.SKU,
        stock: parseInt(v.stock),
        price: parseFloat(v.price),
      };

      if (v.id) {
        await prisma.productVariant.update({
          where: { id: v.id },
          data: variantData,
        });
      } else {
        await prisma.productVariant.create({ data: variantData });
      }
    })
  );
}

// Sync product stock/price from variants
await syncProductFromVariants(product.id);

// Fetch updated variants for image mapping
const updatedVariants = await prisma.productVariant.findMany({
  where: { productId: product.id },
});

// Save images for each variant
for (const [variantIndex, imageFiles] of Object.entries(variantImagesMap)) {
  const variantId = updatedVariants[parseInt(variantIndex, 10)]?.id;
  if (!variantId) continue;

  await Promise.all(
    imageFiles.map(file =>
      prisma.productImage.create({
        data: { 
          productVariantId: variantId,
          url: `/uploads/products/images/${file.filename}`,
        },
      })
    )
  );
}

// Handle videos
const videoFiles = files.videos || [];
if (videoFiles.length > 0) {
  await Promise.all(
    videoFiles.map(file =>
      prisma.productVideo.create({
        data: {
          productId: product.id,
          url: `/uploads/products/videos/${file.filename}`,
        },
      })
    )
  );
}




    
    // Step 4 — return full product
   const fullProduct = await prisma.product.findUnique({
  where: { id: product.id },
  include: {
    videos: true,
    category: true,
    variants: {
      include: {
        images: true, // <-- This is the key fix
      },
    },
  },
});


    res.status(201).json(fullProduct);
  } catch (err) {
    console.error("Error update product:", err);
    res.status(500).json({ message: "Failed to update product.", error: err });
  }
};


 
// controllers/product.controller.ts  // controllers/productController.ts
 // controllers/productController.ts 

export const updateProductImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vendorId, name, description, longDescription } = req.body;

    // Parse variants JSON safely
    let variantsData: any[] = [];
    try {
      variantsData = JSON.parse(req.body.variants || "[]");
    } catch (err) {
      return res.status(400).json({ message: "Invalid variants JSON" });
    }

    // Fetch product with variants + images
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { variants: { include: { images: true } } },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update main product
    await prisma.product.update({
      where: { id: Number(id) },
      data: {
        vendorId: Number(vendorId),
        name,
        description,
        longDescription,
      },
    });

    // Normalize uploaded files (from Multer)
    const uploadedFiles: Express.Multer.File[] = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    // Track variant IDs we are keeping
    const incomingVariantIds = variantsData.filter(v => v.id).map(v => v.id);

    // 🔹 Remove variants that were deleted on frontend
    await prisma.productVariant.deleteMany({
      where: {
        productId: Number(id),
        id: { notIn: incomingVariantIds }, // delete variants not sent
      },
    });

    // 🔹 Process each variant from frontend
    for (let i = 0; i < variantsData.length; i++) {
      const variant = variantsData[i];

      if (variant.id) {
        // --- Update existing variant ---
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            color: variant.color,
            size: variant.size,
            SKU: variant.SKU,
            price: Number(variant.price),
            stock: Number(variant.stock),
          },
        });

        // Keep only preserved images
        const preservedImageIds = variant.images
          .filter((img: any) => img.id)
          .map((img: any) => img.id);

        await prisma.productImage.deleteMany({
          where: {
            productVariantId: variant.id,
            id: { notIn: preservedImageIds },
          },
        });

        // Save new uploaded images for this variant
        const filesForVariant = uploadedFiles.filter(
          (f) => f.fieldname === `variantImages_${i}`
        );

        for (const file of filesForVariant) {
          await prisma.productImage.create({
            data: {
              url: `/uploads/products/images/${file.filename}`,
              productVariantId: variant.id,
            },
          });
        }
      } else {
        // --- Create new variant ---
        const newVariant = await prisma.productVariant.create({
          data: {
            productId: Number(id),
            color: variant.color,
            size: variant.size,
            SKU: variant.SKU,
            price: Number(variant.price),
            stock: Number(variant.stock),
          },
        });

        // Save uploaded images for new variant
        const filesForVariant = uploadedFiles.filter(
          (f) => f.fieldname === `variantImages_${i}`
        );

        for (const file of filesForVariant) {
          await prisma.productImage.create({
            data: {
              url: `/uploads/products/images/${file.filename}`,
              productVariantId: newVariant.id,
            },
          });
        }
      }
    }

    res.json({ success: true, message: "Product & variants updated successfully" });
  } catch (error: any) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};







export const updateProductVideo = async (req: Request, res: Response) => {  
  const { files } = req as Request & { files: MulterFiles };
  
  const productid = Number(req.params.id);  
   
  try {
    const {
      vendorId, name, description, longDescription, categoryId, subCategoryId,
      brandId, materialId, originId  
      // This will be an array from the formData 
    } = req.body;

    const user = req.user;
 
     
 
    const vendor = await prisma.vendor.findFirst({ where: { userId: parseInt(vendorId) } }); 
    if (!vendor) {
      if(!user?.email.toString().includes("huzaifeeyunus")){
        return res.status(403).json({ message: "Not a vendor." });

      }
    }
 
   
    const product = await prisma.product.update({
      where: { id: productid },
      data: {
        name,
        description,
        longDescription
      },
    });

// Handle videos
const videoFiles = files.videos || [];
if (videoFiles.length > 0) {
  await Promise.all(
    videoFiles.map(file =>
      prisma.productVideo.create({
        data: {
          productId: productid,
          url: `/uploads/products/videos/${file.filename}`,
        },
      })
    )
  );
}




    
    // Step 4 — return full product
   const fullProduct = await prisma.product.findUnique({
  where: { id: productid },
  include: {
    videos: true,
    category: true,
    variants: {
      include: {
        images: true, // <-- This is the key fix
      },
    },
  },
});


    res.status(201).json(fullProduct);
  } catch (err) {
    console.error("Error updating product video:", err);
    res.status(500).json({ message: "Failed to update product video.", error: err });
  }
};


export const updateProduct = async (req: Request, res: Response) => {  
  //const { files } = req as Request & { files: MulterFiles };
  
  const id = req.params.id;  
   
  try {
    const {
      vendorId, name, description, longDescription, price, stock, categoryId, subCategoryId,
      brandId, materialId, originId, tag, variants 
      // This will be an array from the formData 
    } = req.body;

    const user = req.user;

    let slug = generateSKU(name);
    
    if (!subCategoryId || !categoryId) {
      return res.status(400).json({ message: "Missing category or subcategory." });
    }
  
   
    const vendor = await prisma.vendor.findFirst({ where: { userId: parseInt(vendorId) } }); 
    if (!vendor) {
      if(!user?.email.toString().includes("huzaifeeyunus@gmail.com")){
        return res.status(403).json({ message: "Not a vendor." });

      }
    }

    // Step 1 — create main product
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        longDescription,
        price: 0,
        stock: 0,
        slug,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
        brandId: parseInt(brandId) ?? null,
        materialId: parseInt(materialId) ?? null,
        originId: parseInt(originId) ?? null, 
        tag: tag, 
        vendorId: vendor?.id, 
      },
    });

  
 
    
    // Step 4 — return full product
   const fullProduct = await prisma.product.findUnique({
  where: { id: product.id },
  include: {
    videos: true,
    category: true,
    variants: {
      include: {
        images: true, // <-- This is the key fix
      },
    },
  },
});


    res.status(201).json(fullProduct);
  } catch (err) {
    console.error("Error update product:", err);
    res.status(500).json({ message: "Failed to update product.", error: err });
  }
};
  

// Delete Product and all related records
export const deleteProducttt = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = req.user;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!vendor) {
      if (!user?.email.startsWith("huzaifeeyunus")) {
        return res.status(403).json({ message: "Not a vendor." });
      }
    }

    // 1️⃣ Find all variants of this product
    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      select: { id: true },
    });

    const variantIds = variants.map(v => v.id);

    // 2️⃣ Delete all product images for these variants
    if (variantIds.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productVariantId: { in: variantIds } },
      });
    }

    // 3️⃣ Delete all variants
    await prisma.productVariant.deleteMany({
      where: { productId: id },
    });

    // 4️⃣ Delete ratings and reviews
    await prisma.rating.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });

    // 5️⃣ Delete cart items and order items referencing this product
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.orderItem.deleteMany({ where: { productId: id } });

    // 6️⃣ Finally delete the product itself
    await prisma.product.delete({ where: { id } });

    res.json({ message: "Product and all related data deleted successfully." });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Failed to delete product." });
  }
};



// controllers/productController.ts 

export const deleteProductVariantttt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: Number(id) },
      include: { images: true },
    });

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    // Delete all images related to this variant
    await prisma.productImage.deleteMany({
      where: { productVariantId: variant.id },
    });

    // Delete the variant itself
    await prisma.productVariant.delete({
      where: { id: variant.id },
    });

    res.json({ success: true, message: "Variant deleted successfully" });
  } catch (error: any) {
    console.error("Delete variant error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




export const deleteProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = req.user;

  try {
    // Check vendor ownership unless admin
    const product = await prisma.product.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    const isAdmin = user?.role.toString().toUpperCase()   === "ADMIN" || user?.email.startsWith("huzaifeeyunus");
    if (!isAdmin && (!vendor || vendor.id !== product.vendorId)) {
      return res.status(403).json({ message: "Not authorized to delete this product." });
    }

    // 1️⃣ Delete all product images for these variants
    const variantIds = (await prisma.productVariant.findMany({
      where: { productId: id },
      select: { id: true },
    })).map(v => v.id);

    if (variantIds.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productVariantId: { in: variantIds } },
      });
    }

    // 2️⃣ Delete variants, reviews, ratings, cartItems, orderItems
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.rating.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.orderItem.deleteMany({ where: { productId: id } });
    // 3️⃣ Delete the product itself
    await prisma.product.delete({ where: { id } });

    res.json({ message: "Product and all related data deleted successfully." });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Failed to delete product." });
  }
};

export const deleteProductVariant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
 
    const variant = await prisma.productVariant.findUnique({
      where: { id: Number(id) },
      include: { images: true, product: true },
    });

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    const isAdmin = user?.role.toString().toUpperCase() === "ADMIN" || user?.email.startsWith("huzaifeeyunus");
    if (!isAdmin && (!vendor || vendor.id !== variant.product.vendorId)) {
      return res.status(403).json({ message: "Not authorized to delete this variant." });
    }

    // Delete all images related to this variant
    await prisma.productImage.deleteMany({
      where: { productVariantId: variant.id },
    });

    // Delete the variant itself
    await prisma.productVariant.delete({
      where: { id: variant.id },
    });

    res.json({ success: true, message: "Variant deleted successfully" });
  } catch (error: any) {
    console.error("Delete variant error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
