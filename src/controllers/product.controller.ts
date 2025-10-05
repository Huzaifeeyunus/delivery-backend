import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { generateSKU } from "../middlewares/randomnames.middleware";
//import { connect } from "http2";
import { StockStatus } from "@prisma/client";
import { log } from "console";

interface MulterFiles {
  images?: Express.Multer.File[];
  videos?: Express.Multer.File[];
  [key: string]: Express.Multer.File[] | undefined;
}

interface VariantForm {
  id?: number | 0;
  productId: number | 0;
  colorId: number;
  sizeId: number;
  price?: number;
  stock?: number;
  available?: boolean;
  discountPrice?: number;
  stockStatus?: number;
  sizes?: ProductVariantSizeForm[];
  images?: ProductImageForm[];
}
 
interface ProductVariantSizeForm {
  id?: number | 0;
  productVariantId: number | 0;
  sizeId: number;
  SKU?: string;
  price: number;
  stock: number;
  available?: boolean;
  discountPrice?: number;
}

interface ProductImageForm {
  id?: number | 0;
  url: string;
  alt?: string;
}

// ------------------- CREATE PRODUCT -------------------
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
      variants,
    } = req.body;

    const user = req.user;
    if (!subCategoryId || !categoryId)
      return res.status(400).json({ message: "Missing category or subcategory." });

    const vendor = await prisma.vendor.findUnique({ where: { userId: user?.id } });
    if (!vendor) return res.status(403).json({ message: "Not a vendor." });

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
        brandId: brandId ? parseInt(brandId) : null,
        materialId: materialId ? parseInt(materialId) : null,
        originId: originId ? parseInt(originId) : null,
        tag,
        vendorId: vendor.id,
      },
    });

    // Create variants & sizes
    if (variants && Array.isArray(variants)) {
      for (const v of variants) {
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            colorId: v.colorId,
            SKU: v.SKU ?? `GEN-${product.id}-${v.colorId}`,
            price: parseFloat(v.price.toString()),
            stock: parseInt(v.stock.toString()),
            discountPrice: v.discountPrice ?? null,
            available: v.available ?? true,
          },
        });

        if (v.sizes && Array.isArray(v.sizes)) {
          for (const s of v.sizes) {
            await prisma.productVariantSize.create({
              data: {
                productVariantId: variant.id,
                sizeId: s.sizeId,
                SKU: s.SKU ?? `GEN-${product.id}-${v.colorId}`,
                price: parseFloat(s.price.toString()),
                stock: parseInt(s.stock.toString()),
                discountPrice: s.discountPrice ?? null,
                available: s.available ?? true,
              },
            });
          }
        }

        // Variant images
        if (v.images && Array.isArray(v.images)) {
          for (const img of v.images) {
            await prisma.productImage.create({
              data: {
                productVariantId: variant.id,
                url: img.url,
              },
            });
          }
        }
      }
    }

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: { include: { sizes: true, images: true, color: true } },
        videos: true,
      },
    });

    res.status(201).json(fullProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: "Failed to create product.", error: err });
  }
};
 

// ------------------- CREATE PRODUCT WITH IMAGE -------------------  
export const createProductWithImage = async (req: Request, res: Response) => {
  try {
    //const { files } = req as Request & { files: Record<string, Express.Multer.File[]> };
    const files = (req as Request & { files: Express.Multer.File[] }).files || [];

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
      variants, // JSON array from frontend
    } = req.body;

    //log("variants:::", variants)
    const vendorId = req.user?.id;
    if (!vendorId) return res.status(401).json({ message: "Unauthorized" });

    const slug = generateSKU(name);

    // Parse variants
    let parsedVariants: any[] = [];
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (err) {
        console.error("Invalid variants JSON:", err);
      }
    }

    // Step 1 — Create main product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        longDescription: longDescription || null,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        slug,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
        brandId: brandId ? parseInt(brandId) : null,
        materialId: materialId ? parseInt(materialId) : null,
        originId: originId ? parseInt(originId) : null,
        tag: tag || null,
        vendorId,
        // Product-level images
        images: {
          create: files
            .filter(f => f.fieldname.startsWith("productImages_"))
            .map(f => ({ url: `/uploads/products/images/${f.filename}` })),
        },
        // Variants
        variants: {
          create: parsedVariants.map((v, idx) => {
            // Map uploaded files to this variant (based on naming convention) 
            const variantFiles = files.filter(f => f.fieldname === `variantImages_${idx}`);  
            const hasSizes = v.sizes && v.sizes.length > 0;

            return {
              colorId: parseInt(v.colorId),
              // ✅ Variant-level fallback fields
              price: !hasSizes ? parseFloat(v.price) || parseFloat(price) || 0 : 0,
              stock: !hasSizes ? parseInt(v.stock) || parseInt(stock) || 0 : 0,
              discountPrice: !hasSizes ? (v.discountPrice ? parseFloat(v.discountPrice) : null) : null,
              available: !hasSizes ? (v.available ?? true) : false,
              stockStatus: !hasSizes
                ? (v.stock && parseInt(v.stock) > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK)
                : StockStatus.OUT_OF_STOCK,
              // ✅ Variant-level fallback fields
              sizes: {
                create: v.sizes?.map((s: any) => ({
                  sizeId: parseInt(s.sizeId),
                  price: parseFloat(s.price),
                  stock: parseInt(s.stock),
                  discountPrice: s.discountPrice ? parseFloat(s.discountPrice) : null,
                  available: s.available ?? true,
                  SKU: s.SKU || `${slug}-${v.colorId}-${s.sizeId}`,
                  stockStatus: StockStatus.IN_STOCK,
                })),
              },
              images: {
                create: variantFiles.map((f) => ({
                  url: `/uploads/products/images/${f.filename}`, // Save relative path
                })),
              },
            };
          }),
        },
      },
      include: {
        images: true,  // Include product-level images
        variants: {
          include: {
            sizes: true,
            images: true,
          },
        },
      },
    });

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};


// ------------------- FIND PRODUCTS BY CATEGORY -------------------
export const findProductByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const products = await prisma.product.findMany({
      where: { categoryId: parseInt(categoryId) },
      include: {
        vendor: true,
        videos: true,
        variants: { include: { images: true, sizes: true } },
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

// ------------------- FIND PRODUCTS BY SUBCATEGORY -------------------
export const findProductBySubCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId, subCategoryId } = req.params;

    const products = await prisma.product.findMany({
      where: {
        categoryId: parseInt(categoryId),
        subCategoryId: parseInt(subCategoryId),
      },
      include: {
        vendor: true,
        videos: true,
        variants: { include: { images: true, sizes: true } },
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products by subcategory:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

// ------------------- FIND PRODUCT IMAGES BY VARIANT -------------------
export const findProductImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const productImages = await prisma.productImage.findMany({
      where: { productVariantId: parseInt(id) },
    });

    res.json(productImages);
  } catch (error) {
    console.error("Error fetching product images:", error);
    res.status(500).json({ message: "Failed to fetch product images." });
  }
};

// ------------------- GET PRODUCTS -------------------
export const getProductss = async (req: Request, res: Response) => {
  try {
    const { categoryId, subCategoryId } = req.query;
    const whereClause: any = {};
    if (categoryId) whereClause.categoryId = Number(categoryId);
    if (subCategoryId) whereClause.subCategoryId = Number(subCategoryId);

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        vendor: true,
        images: true,
        videos: true,
        variants: {
          include: { images: true, sizes: true, color: true },
        },
      },
    });
 

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

// ------------------- FIND PRODUCT -------------------
export const findProductt = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        vendor: true,
        category: true,
        subCategory: true,
        images: true,
        videos: true, 
        variants: {
          include: { images: true, sizes: true, color: true},
        },
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Failed to fetch product." });
  }
};
 

 // ------------------- GET PRODUCTS -------------------
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { categoryId, subCategoryId } = req.query;
    const whereClause: any = {};
    if (categoryId) whereClause.categoryId = Number(categoryId);
    if (subCategoryId) whereClause.subCategoryId = Number(subCategoryId);

    let products = await prisma.product.findMany({
      where: whereClause,
      include: {
        vendor: true,
        images: true,
        videos: true,
        variants: {
          include: { images: true, sizes: true, color: true },
        },
      },
    });

    // apply fallback logic
    products = products.map((product) => {
      if (!product.variants || product.variants.length === 0) {
        // ✅ Product-level details are valid
        return product;
      }

      // If variants exist
      product.price = 0;
      product.stock = 0;
      product.discountPrice = null;

      product.variants = product.variants.map((variant) => {
        if (!variant.sizes || variant.sizes.length === 0) {
          // ✅ Variant-level details are valid
          return variant;
        }

        // Sizes exist → variant carries nothing
        variant.price = 0;
        variant.stock = 0;
        variant.discountPrice = 0;
        return variant;
      });

      return product;
    });

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

// ------------------- FIND PRODUCT -------------------
export const findProduct = async (req: Request, res: Response) => {
  try {
    let product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        vendor: true,
        category: true,
        subCategory: true,
        images: true,
        videos: true,
        variants: {
          include: { images: true, sizes: true, color: true },
        },
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    // apply fallback logic
    if (!product.variants || product.variants.length === 0) {
      // ✅ Product-level details are valid
      return res.json(product);
    }

    // If variants exist
    product.price = 0;
    product.stock = 0;
    product.discountPrice = null;

    product.variants = product.variants.map((variant) => {
      if (!variant.sizes || variant.sizes.length === 0) {
        // ✅ Variant-level details are valid
        return variant;
      }

      // Sizes exist → variant carries nothing
      variant.price = 0;
      variant.stock = 0;
      variant.discountPrice = null;
      return variant;
    });

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Failed to fetch product." });
  }
};

 
 
// ------------------- UPDATE PRODUCT ------------------- 

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      description,
      longDescription,
      slug,
      categoryId,
      subCategoryId,
      brandId,
      materialId,
      originId,
      tag,
      price,
      discountPrice,
      stock,
      isAvailable,
      imagesToKeep, // array of URLs to keep
    } = req.body;

    const user = req.user;

    // Find product
    const product = await prisma.product.findUnique({
      where: { id },
      include: { vendor: true, images: true },
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Authorization
    const isAdmin =
      user?.role?.name?.toString().toUpperCase().startsWith("ADMIN") ||
      user?.email?.startsWith("huzaifeeyunus");

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user?.id },
    });

    if (!isAdmin && (!vendor || vendor.id !== product.vendorId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ---------------- Update product fields ----------------
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        longDescription,
        slug,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
        brandId: parseInt(brandId) ? parseInt(brandId) : null,
        materialId: parseInt(materialId) ? parseInt(materialId) : null,
        originId: parseInt(originId) ? parseInt(originId) : null,
        tag,
        price: Number(price) ?? undefined,
        discountPrice: Number(discountPrice) ?? undefined,
        stock: Number(stock) ?? undefined,
        available: Boolean(isAvailable) ?? undefined,
      },
      include: {
        variants: { include: { images: true, sizes: true, color: true } },
        videos: true,
        images: true,
      },
    });

    const productId = updatedProduct.id;

    // ---------------- Handle images ----------------
    // 1. Delete images removed on frontend
    if (imagesToKeep && Array.isArray(imagesToKeep)) {
      await prisma.productImage.deleteMany({
        where: {
          productId,
          url: { notIn: imagesToKeep },
        },
      });
    }

    // 2. Add newly uploaded images
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      for (const file of files) {
        await prisma.productImage.create({
          data: {
            productId,
            url: `/uploads/products/images/${file.filename}`,
          },
        });
      }
    }

    // Return updated product
    const finalProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: { include: { images: true, sizes: true, color: true } },
        images: true,
        videos: true,
      },
    });

    res.json(finalProduct);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: "Failed to update product.", error: err });
  }
};

 
// ------------------- UPDATE PRODUCT IMAGES (SYNC) -------------------
export const updateProductImages = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.id);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded." });
    }

    // Get current images for this product
    const existingImages = await prisma.productImage.findMany({
      where: { productId },
    });

    // Map of current image IDs
    const existingIds = existingImages.map((img) => img.id);

    // Image IDs sent by frontend to keep (those not removed)
    const keepIds = (req.body.keepIds
      ? JSON.parse(req.body.keepIds)
      : []) as number[];

    // 1. Delete images not in keepIds
    const deleteIds = existingIds.filter((id) => !keepIds.includes(id));
    if (deleteIds.length > 0) {
      await prisma.productImage.deleteMany({
        where: { id: { in: deleteIds }, productId },
      });
    }

    // 2. Add newly uploaded images
    for (const file of files) {
      await prisma.productImage.create({
        data: {
          productId,
          url: `/uploads/products/images/${file.filename}`,
        },
      });
    }

    // 3. Return updated product with fresh images
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error("Update product images error:", err);
    res.status(500).json({ message: "Failed to update product images.", error: err });
  }
};

 
// ------------------- UPDATE PRODUCT VIDEOS (SYNC) -------------------
export const updateProductVideos = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.id);
    const files = req.files as Express.Multer.File[];

    // Get current videos for this product
    const existingVideos = await prisma.productVideo.findMany({
      where: { productId },
    });
    const existingIds = existingVideos.map((v) => v.id);

    // Video IDs sent by frontend to keep
    const keepIds = (req.body.keepIds
      ? JSON.parse(req.body.keepIds)
      : []) as number[];

    // 1. Delete videos not in keepIds
    const deleteIds = existingIds.filter((id) => !keepIds.includes(id));
    if (deleteIds.length > 0) {
      await prisma.productVideo.deleteMany({
        where: { id: { in: deleteIds }, productId },
      });
    }

    // 2. Add new uploaded videos
    if (files && files.length > 0) {
      for (const file of files) {
        await prisma.productVideo.create({
          data: {
            productId,
            url: `/uploads/products/videos/${file.filename}`,
          },
        });
      }
    }

    // 3. Return updated product with fresh videos
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { videos: true },
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error("Update product videos error:", err);
    res.status(500).json({ message: "Failed to update product videos.", error: err });
  }
};
 

// ------------------- UPDATE PRODUCT WITH IMAGE/VIDEO/VARIANTS ------------------- 
export const  updateProductWithVariantsAndImages = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    // Accept both shapes from multer:
    // - upload.any() -> req.files is an array of files
    // - upload.fields(...) -> req.files is an object keyed by fieldname
    const rawFiles: any = req.files || [];
    const { productData, variants } = req.body;

    if (!productData) {
      return res.status(400).json({ message: "Missing productData in request." });
    }

    // Parse JSON payloads
    const parsedProduct = JSON.parse(productData);
    const parsedVariants = variants ? JSON.parse(variants) : [];

    // Parse global removed arrays if frontend sent them (they may be JSON strings)
    const removedVariantIds = req.body.removedVariantIds ? JSON.parse(req.body.removedVariantIds) : [];
    const removedSizeIds = req.body.removedSizeIds ? JSON.parse(req.body.removedSizeIds) : [];
    const removedImageIds = req.body.removedImageIds ? JSON.parse(req.body.removedImageIds) : [];

    // Build a map: variantId -> uploaded files[]
    const filesByVariant: Record<number, Express.Multer.File[]> = {};
    const productLevelFiles: Express.Multer.File[] = [];

    // Helper to push file(s) into map
    const pushFileToVariant = (variantId: number, file: Express.Multer.File | Express.Multer.File[]) => {
      if (!filesByVariant[variantId]) filesByVariant[variantId] = [];
      if (Array.isArray(file)) filesByVariant[variantId].push(...file);
      else filesByVariant[variantId].push(file);
    };

    // Normalize rawFiles (array or object)
    if (Array.isArray(rawFiles)) {
      // req.files is an array of files (upload.any())
      for (const f of rawFiles) {
        const field = (f.fieldname || "").toString();
        const m = field.match(/^(\d+)_variant_\d+_images$/);
        if (m) {
          pushFileToVariant(Number(m[1]), f);
        } else if (field === "images") {
          productLevelFiles.push(f);
        }
      }
    } else if (typeof rawFiles === "object" && rawFiles !== null) {
      // req.files is an object keyed by fieldname (upload.fields)
      for (const key of Object.keys(rawFiles)) {
        const val = rawFiles[key];
        const m = key.match(/^(\d+)_variant_\d+_images$/);
        if (m) {
          const vid = Number(m[1]);
          if (Array.isArray(val)) pushFileToVariant(vid, val);
          else pushFileToVariant(vid, val as Express.Multer.File);
        } else if (key === "images") {
          if (Array.isArray(val)) productLevelFiles.push(...val);
          else productLevelFiles.push(val as Express.Multer.File);
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) Update product base fields
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: parsedProduct.name,
          description: parsedProduct.description,
          longDescription: parsedProduct.longDescription,
          slug: parsedProduct.slug,
          categoryId: parsedProduct.categoryId,
          subCategoryId: parsedProduct.subCategoryId,
          brandId: parsedProduct.brandId,
          materialId: parsedProduct.materialId,
          originId: parsedProduct.originId,
          tag: parsedProduct.tag,
        },
      });

      // 2) Sync product-level images
      // If parsedProduct.keepImageIds provided -> delete others. If not provided -> don't delete anything.
      const keepImageIds: number[] | null = parsedProduct.keepImageIds ?? null;
      if (Array.isArray(keepImageIds)) {
        await tx.productImage.deleteMany({
          where: { productId: id, id: { notIn: keepImageIds } },
        });
      }
      // Delete any explicitly removed images (global)
      if (Array.isArray(removedImageIds) && removedImageIds.length > 0) {
        await tx.productImage.deleteMany({
          where: { id: { in: removedImageIds } },
        });
      }
      // Save uploaded product-level images (if any)
      if (productLevelFiles.length > 0) {
        for (const img of productLevelFiles) {
          await tx.productImage.create({
            data: {
              productId: id,
              url: `/uploads/products/images/${img.filename}`,
            },
          });
        }
      }

      // 3) Sync product videos (keeps old approach — only delete if keepVideoIds provided)
      const keepVideoIds: number[] = parsedProduct.keepVideoIds ?? [];
      if (Array.isArray(parsedProduct.keepVideoIds)) {
        await tx.productVideo.deleteMany({
          where: { productId: id, id: { notIn: keepVideoIds } },
        });
      }
      if (rawFiles && ((rawFiles as any).videos || (rawFiles as any)["videos"])) {
        // if videos were uploaded under 'videos' key (handle both shapes)
        const videoFiles: Express.Multer.File[] = [];
        if (Array.isArray(rawFiles)) {
          for (const f of rawFiles as any[]) if (f.fieldname === "videos") videoFiles.push(f);
        } else if (rawFiles.videos) {
          if (Array.isArray(rawFiles.videos)) videoFiles.push(...rawFiles.videos);
          else videoFiles.push(rawFiles.videos);
        }
        for (const v of videoFiles) {
          await tx.productVideo.create({
            data: { productId: id, url: `/uploads/products/videos/${v.filename}` },
          });
        }
      }

      // 4) Sync variants (delete missing variants only if parsedVariants provides ids)
      const keepVariantIds = parsedVariants.map((v: any) => v.id).filter((x: any) => x);
      if (keepVariantIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: { productId: id, id: { notIn: keepVariantIds } },
        });
      } else if (Array.isArray(removedVariantIds) && removedVariantIds.length > 0) {
        // If frontend sends removedVariantIds explicitly, remove those
        await tx.productVariant.deleteMany({
          where: { id: { in: removedVariantIds } },
        });
      }

      // Process each variant from frontend payload
      for (const variant of parsedVariants) {
        // Keep the original incoming id (could be 0)
        const incomingVariantId = variant.id ?? 0;
        let variantId = incomingVariantId;

        if (variantId && variantId > 0) {
          // Update existing variant
          await tx.productVariant.update({
            where: { id: variantId },
            data: {
              colorId: variant.colorId,
              // ✅ If no sizes, allow storing price/stock at variant level
              price: (variant.sizes?.length ?? 0) === 0 ? variant.price : 0,
              stock: (variant.sizes?.length ?? 0) === 0 ? variant.stock : 0,
              discountPrice: (variant.sizes?.length ?? 0) === 0 ? variant.discountPrice : null,
              available: (variant.sizes?.length ?? 0) === 0 ? variant.available : false,
            },
          });
        } else {
          // Create new variant
          const newVariant = await tx.productVariant.create({
            data: {
              productId: id,
              colorId: variant.colorId,
              // ✅ If no sizes, allow storing price/stock at variant level
              price: (variant.sizes?.length ?? 0) === 0 ? variant.price : 0,
              stock: (variant.sizes?.length ?? 0) === 0 ? variant.stock : 0,
              discountPrice: (variant.sizes?.length ?? 0) === 0 ? variant.discountPrice : null,
              available: (variant.sizes?.length ?? 0) === 0 ? variant.available : false,
            },
          });
          variantId = newVariant.id;
        }

        // --- Variant Images ---
        // The frontend may send existingImageIds (kept ones) or keepImageIds.
        const existingImageIds: number[] | undefined = variant.existingImageIds ?? variant.keepImageIds;

        if (Array.isArray(existingImageIds)) {
          // delete any images belonging to this variant that are NOT in the existingImageIds array
          await tx.productImage.deleteMany({
            where: { productVariantId: variantId, id: { notIn: existingImageIds } },
          });
        }

        // Attach uploaded images for this variant.
        // Use filesByVariant[incomingVariantId] (so files uploaded under `0_variant_*` are attached to newly created variants)
        const filesForThisVariant = (filesByVariant[incomingVariantId] ?? filesByVariant[variantId] ?? []) as Express.Multer.File[];
        if (filesForThisVariant.length > 0) {
          for (const img of filesForThisVariant) {
            await tx.productImage.create({
              data: {
                productId: id,
                productVariantId: variantId,
                url: `/uploads/products/images/${img.filename}`,
              },
            });
          }
        }

        // --- Variant Sizes ---
        const keepSizeIds = (variant.sizes ?? []).map((s: any) => s.id).filter((x: any) => x);
        if (keepSizeIds.length > 0) {
          await tx.productVariantSize.deleteMany({
            where: { productVariantId: variantId, id: { notIn: keepSizeIds } },
          });
        } else if (Array.isArray(removedSizeIds) && removedSizeIds.length > 0) {
          // if removedSizeIds sent globally, remove them (they may belong to different variants)
          await tx.productVariantSize.deleteMany({
            where: { id: { in: removedSizeIds } },
          });
        }

        for (const size of variant.sizes ?? []) {
          if (size.id && size.id > 0) {
            await tx.productVariantSize.update({
              where: { id: size.id },
              data: {
                sizeId: size.sizeId,
                price: size.price,
                stock: size.stock,
              },
            });
          } else {
            await tx.productVariantSize.create({
              data: {
                productVariantId: variantId,
                sizeId: size.sizeId,
                price: size.price,
                stock: size.stock,
              },
            });
          }
        }
      }

      // 6) Return updated product with relations
      return tx.product.findUnique({
        where: { id },
        include: {
          images: true,
          videos: true,
          variants: {
            include: {
              images: true,
              sizes: { include: { size: true } },
              color: true,
            },
          },
          category: true,
          brand: true,
        },
      });
    });

    // 7) Recalculate stock/price aggregates
    await syncProductFromVariants(id);

    res.json(result);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: "Failed to update product.", error: (err as Error).message });
  }
};



// ------------------- SYNC PRODUCT FUNCTION -------------------
async function syncProductFromVariantss(productId: number) {
  const sizes = await prisma.productVariantSize.findMany({
    where: { variant: { productId } },
    select: { price: true, discountPrice: true, stock: true, available: true },
  });

  if (!sizes.length) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        price: 0,
        discountPrice: null,
        stock: 0,
        available: false,
        stockStatus: StockStatus.OUT_OF_STOCK,
      },
    });
    return;
  }

  const minPrice = Math.min(...sizes.map((s) => s.price));
  const minDiscount = Math.min(...sizes.map((s) => s.discountPrice ?? Number.MAX_VALUE));
  const totalStock = sizes.reduce((sum, s) => sum + s.stock, 0);
  const anyAvailable = sizes.some((s) => s.available);
  const stockStatus = totalStock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK;

  await prisma.product.update({
    where: { id: productId },
    data: {
      price: minPrice,
      discountPrice: minDiscount === Number.MAX_VALUE ? null : minDiscount,
      stock: totalStock,
      available: anyAvailable,
      stockStatus,
    },
  });
}
// ------------------- SYNC PRODUCT FUNCTION ------------------- 
async function syncProductFromVariants(productId: number) {
  // 1) Gather all sizes for this product
  const sizes = await prisma.productVariantSize.findMany({
    where: { variant: { productId } },
    select: { price: true, discountPrice: true, stock: true, available: true },
  });

  if (sizes.length > 0) {
    // ✅ Case 1: sizes exist → sync from sizes
    const minPrice = Math.min(...sizes.map((s) => s.price));
    const minDiscount = Math.min(...sizes.map((s) => s.discountPrice ?? Number.MAX_VALUE));
    const totalStock = sizes.reduce((sum, s) => sum + s.stock, 0);
    const anyAvailable = sizes.some((s) => s.available);
    const stockStatus = totalStock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK;

    await prisma.product.update({
      where: { id: productId },
      data: {
        price: minPrice,
        discountPrice: minDiscount === Number.MAX_VALUE ? null : minDiscount,
        stock: totalStock,
        available: anyAvailable,
        stockStatus,
      },
    });
    return;
  }

  // 2) If no sizes, check for variants
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    select: { price: true, discountPrice: true, stock: true, available: true },
  });

  if (variants.length > 0) {
    // ✅ Case 2: variants exist, but no sizes → sync from variants
    const minPrice = Math.min(...variants.map((v) => v.price ?? 0));
    const minDiscount = Math.min(...variants.map((v) => v.discountPrice ?? Number.MAX_VALUE));
    const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    const anyAvailable = variants.some((v) => v.available ?? false);
    const stockStatus = totalStock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK;

    await prisma.product.update({
      where: { id: productId },
      data: {
        price: minPrice,
        discountPrice: minDiscount === Number.MAX_VALUE ? null : minDiscount,
        stock: totalStock,
        available: anyAvailable,
        stockStatus,
      },
    });
    return;
  }

  // 3) If no sizes and no variants → product is empty/fallback to 0
  await prisma.product.update({
    where: { id: productId },
    data: {
      price: 0,
      discountPrice: null,
      stock: 0,
      available: false,
      stockStatus: StockStatus.OUT_OF_STOCK,
    },
  });
}

// ------------------- DELETE PRODUCT -------------------
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = req.user;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { vendor: true },
    });
    if (!product) return res.status(404).json({ message: "Product not found." });

    const isAdmin =
      user?.role?.toString().toUpperCase() === "ADMIN" ||
      user?.email.startsWith("huzaifeeyunus");
    const vendor = await prisma.vendor.findUnique({ where: { userId: user?.id } });

    if (!isAdmin && (!vendor || vendor.id !== product.vendorId))
      return res.status(403).json({ message: "Not authorized." });

    // Delete all variants & their related data
    const variantIds = (
      await prisma.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      })
    ).map((v) => v.id);

    if (variantIds.length) {
      await prisma.productVariantSize.deleteMany({ where: { productVariantId: { in: variantIds } } });
      await prisma.productImage.deleteMany({ where: { productVariantId: { in: variantIds } } });
      await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
    }

    // Delete product-related data
    await prisma.rating.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.orderItem.deleteMany({ where: { productId: id } });
    await prisma.productVideo.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    res.json({ message: "Product and all related data deleted successfully." });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: "Failed to delete product.", error: err });
  }
};

// ------------------- DELETE VARIANT -------------------
export const deleteProductVariant = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = req.user;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: { product: { include: { vendor: true } } },
    });
    if (!variant) return res.status(404).json({ message: "Variant not found." });

    const isAdmin =
      user?.role?.toString().toUpperCase() === "ADMIN" ||
      user?.email.startsWith("huzaifeeyunus");
    const vendor = await prisma.vendor.findUnique({ where: { userId: user?.id } });

    if (!isAdmin && (!vendor || vendor.id !== variant.product.vendorId))
      return res.status(403).json({ message: "Not authorized." });

    // Delete variant sizes and images
    await prisma.productVariantSize.deleteMany({ where: { productVariantId: variant.id } });
    await prisma.productImage.deleteMany({ where: { productVariantId: variant.id } });
    await prisma.productVariant.delete({ where: { id: variant.id } });

    await syncProductFromVariants(variant.productId);

    res.json({ message: "Variant deleted successfully." });
  } catch (err: any) {
    console.error("Delete variant error:", err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// ------------------- DELETE VARIANT SIZE -------------------
export const deleteProductVariantSize = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = req.user;

    const size = await prisma.productVariantSize.findUnique({
      where: { id },
      include: { variant: { include: { product: { include: { vendor: true } } } } },
    });
    if (!size) return res.status(404).json({ message: "Size not found." });

    const isAdmin =
      user?.role?.name.toString().toUpperCase() === "ADMIN" ||
      user?.email.startsWith("huzaifeeyunus");
    const vendor = await prisma.vendor.findUnique({ where: { userId: user?.id } });

    if (!isAdmin && (!vendor || vendor.id !== size.variant.product.vendorId))
      return res.status(403).json({ message: "Not authorized." });

    await prisma.productVariantSize.delete({ where: { id } });
    await syncProductFromVariants(size.variant.productId);

    res.json({ message: "Size deleted successfully." });
  } catch (err: any) {
    console.error("Delete size error:", err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};


 