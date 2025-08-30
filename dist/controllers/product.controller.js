"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.updateProductVideo = exports.updateProductImage = exports.updateProductWithImage = exports.findProduct = exports.findProductBySubCategory = exports.findProductByCategory = exports.findProductImage = exports.getProducts = exports.createProductWithImage = exports.createProduct = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const randomnames_middleware_1 = require("../middlewares/randomnames.middleware");
// Create Product
const createProduct = async (req, res) => {
    try {
        const { name, description, longDescription, price, stock, slug, categoryId, subCategoryId, brandId, materialId, originId, tag, variants // This will be an array from the formData 
         } = req.body;
        const user = req.user;
        if (!subCategoryId || !categoryId) {
            return res.status(400).json({ message: "Missing category or subcategory." });
        }
        const vendor = await prisma_1.default.vendor.findUnique({ where: { userId: user?.id } });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        // Step 1 — create main product
        const product = await prisma_1.default.product.create({
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
            const variantData = variants.map((v) => ({
                productId: product.id,
                color: v.color, // If using string
                size: v.size, // If using string
                SKU: v.SKU,
                stock: parseInt(v.stock),
                price: parseFloat(v.price),
            }));
            await prisma_1.default.productVariant.createMany({ data: variantData });
        }
        // Step 4 — return full product
        const fullProduct = await prisma_1.default.product.findUnique({
            where: { id: product.id },
            include: { videos: true, variants: true },
        });
        res.status(201).json(fullProduct);
    }
    catch (err) {
        console.error("Error creating product:", err);
        res.status(500).json({ message: "Failed to create product.", error: err });
    }
};
exports.createProduct = createProduct;
const createProductWithImage = async (req, res) => {
    const uploadedFiles = req.files || [];
    try {
        const { name, description, longDescription, price, stock, categoryId, subCategoryId, brandId, materialId, originId, tag, variants, // JSON string from frontend
         } = req.body;
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        // Vendor validation
        const vendor = await prisma_1.default.vendor.findUnique({ where: { userId: user.id } });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor" });
        if (!categoryId || !subCategoryId)
            return res.status(400).json({ message: "Missing category or subcategory" });
        const slug = (0, randomnames_middleware_1.generateSKU)(name);
        // Step 1 — Create main product
        const product = await prisma_1.default.product.create({
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
        let parsedVariants = [];
        if (variants) {
            try {
                parsedVariants = JSON.parse(variants);
            }
            catch (err) {
                console.warn("Failed to parse variants:", err);
            }
        }
        // Step 3 — Create variants + images
        for (let i = 0; i < parsedVariants.length; i++) {
            const v = parsedVariants[i];
            const variant = await prisma_1.default.productVariant.create({
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
            const filesForVariant = uploadedFiles.filter((f) => f.fieldname === `variantImages_${i}`);
            for (const file of filesForVariant) {
                await prisma_1.default.productImage.create({
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
            await prisma_1.default.productVideo.create({
                data: {
                    productId: product.id,
                    url: `/uploads/products/videos/${file.filename}`,
                },
            });
        }
        // Step 5 — Return full product with variants and images
        const fullProduct = await prisma_1.default.product.findUnique({
            where: { id: product.id },
            include: {
                category: true,
                videos: true,
                variants: { include: { images: true } },
            },
        });
        return res.status(201).json(fullProduct);
    }
    catch (err) {
        console.error("Error creating product:", err);
        return res.status(500).json({ message: "Failed to create product", error: err.message });
    }
};
exports.createProductWithImage = createProductWithImage;
// Get All Products
const getProducts = async (_req, res) => {
    const { categoryId, subCategoryId } = _req.query;
    try {
        if (categoryId && !subCategoryId) {
            const products = await prisma_1.default.product.findMany({
                where: { categoryId: Number(categoryId) },
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
        else if (categoryId && subCategoryId) {
            const products = await prisma_1.default.product.findMany({
                where: { categoryId: Number(categoryId), subCategoryId: Number(subCategoryId) },
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
        else {
            const products = await prisma_1.default.product.findMany({
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
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch products." });
    }
};
exports.getProducts = getProducts;
// Get All Products
const findProductImage = async (_req, res) => {
    try {
        const productImage = await prisma_1.default.productImage.findMany({
            where: { productVariantId: parseInt(_req.params.id) },
        });
        res.json(productImage);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch products." });
    }
};
exports.findProductImage = findProductImage;
// Get All Products
const findProductByCategory = async (_req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { categoryId: parseInt(_req.params.categoryId) },
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
    catch (err) {
        res.status(500).json({ message: "Failed to fetch products." });
    }
};
exports.findProductByCategory = findProductByCategory;
// Get All Products
const findProductBySubCategory = async (_req, res) => {
    const { categoryId, subCategoryId } = _req.query;
    try {
        const products = await prisma_1.default.product.findMany({
            where: { categoryId: parseInt(_req.params.categoryId), subCategoryId: parseInt(_req.params.subCategoryId) },
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
    catch (err) {
        res.status(500).json({ message: "Failed to fetch products." });
    }
};
exports.findProductBySubCategory = findProductBySubCategory;
// Find A Products
const findProduct = async (req, res) => {
    try {
        const product = await prisma_1.default.product.findUnique({
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
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch products." });
    }
};
exports.findProduct = findProduct;
//syncProductFromVariants 
async function syncProductFromVariants(productId) {
    const variants = await prisma_1.default.productVariant.findMany({
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
        await prisma_1.default.product.update({
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
    const minDiscount = Math.min(...variants.map(v => v.discountPrice ?? Number.MAX_VALUE));
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    const anyAvailable = variants.some(v => v.available);
    const stockStatus = totalStock > 0 ? "In Stock" : "Out of Stock";
    await prisma_1.default.product.update({
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
const updateProductWithImage = async (req, res) => {
    const { files } = req;
    const id = req.params.id;
    try {
        const { vendorId, name, description, longDescription, price, stock, categoryId, subCategoryId, brandId, materialId, originId, tag, variants
        // This will be an array from the formData 
         } = req.body;
        const user = req.user;
        let slug = (0, randomnames_middleware_1.generateSKU)(name);
        if (!subCategoryId || !categoryId) {
            return res.status(400).json({ message: "Missing category or subcategory." });
        }
        const vendor = await prisma_1.default.vendor.findFirst({ where: { userId: parseInt(vendorId) } });
        if (!vendor)
            return res.status(403).json({ message: "Not a vendor." });
        // Step 1 — create main product
        const product = await prisma_1.default.product.update({
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
                vendorId: vendor.id ?? null,
            },
        });
        // Example: variantImagesMap[0] = [File, File, ...]
        const vfiles = req.files;
        const variantImagesMap = {};
        try {
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
        }
        catch (err) {
            console.error("found err------: ", err);
        }
        // Example: variantImagesMap[0] = [File, File, ...]
        // Step 3 — handle variants
        // Step 3 — handle variants
        let parsedVariants = [];
        if (req.body.variants) {
            try {
                parsedVariants = JSON.parse(req.body.variants);
            }
            catch {
                console.warn("Could not parse variants");
            }
        }
        if (parsedVariants.length) {
            // Get existing variants for this product
            const existingVariants = await prisma_1.default.productVariant.findMany({
                where: { productId: product.id },
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
                await prisma_1.default.productVariant.deleteMany({
                    where: { id: { in: idsToDelete.filter((id) => id !== undefined) } },
                });
            }
            // Create or update variants
            await Promise.all(parsedVariants.map(async (v) => {
                const variantData = {
                    productId: product.id,
                    color: v.color,
                    size: v.size,
                    SKU: v.SKU,
                    stock: parseInt(v.stock),
                    price: parseFloat(v.price),
                };
                if (v.id) {
                    await prisma_1.default.productVariant.update({
                        where: { id: v.id },
                        data: variantData,
                    });
                }
                else {
                    await prisma_1.default.productVariant.create({ data: variantData });
                }
            }));
        }
        // Sync product stock/price from variants
        await syncProductFromVariants(product.id);
        // Fetch updated variants for image mapping
        const updatedVariants = await prisma_1.default.productVariant.findMany({
            where: { productId: product.id },
        });
        // Save images for each variant
        for (const [variantIndex, imageFiles] of Object.entries(variantImagesMap)) {
            const variantId = updatedVariants[parseInt(variantIndex, 10)]?.id;
            if (!variantId)
                continue;
            await Promise.all(imageFiles.map(file => prisma_1.default.productImage.create({
                data: {
                    productVariantId: variantId,
                    url: `/uploads/products/images/${file.filename}`,
                },
            })));
        }
        // Handle videos
        const videoFiles = files.videos || [];
        if (videoFiles.length > 0) {
            await Promise.all(videoFiles.map(file => prisma_1.default.productVideo.create({
                data: {
                    productId: product.id,
                    url: `/uploads/products/videos/${file.filename}`,
                },
            })));
        }
        // Step 4 — return full product
        const fullProduct = await prisma_1.default.product.findUnique({
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
    }
    catch (err) {
        console.error("Error update product:", err);
        res.status(500).json({ message: "Failed to update product.", error: err });
    }
};
exports.updateProductWithImage = updateProductWithImage;
// controllers/product.controller.ts 
// controllers/product.controller.ts
const updateProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { vendorId, name, description, longDescription } = req.body;
        // Parse variants JSON
        const variantsData = JSON.parse(req.body.variants || "[]");
        // Find existing product with variants + images
        const product = await prisma_1.default.product.findUnique({
            where: { id: Number(id) },
            include: { variants: { include: { images: true } } },
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        // Update product main fields
        await prisma_1.default.product.update({
            where: { id: Number(id) },
            data: {
                vendorId: Number(vendorId),
                name,
                description,
                longDescription,
            },
        });
        // Ensure req.files is always an array
        const uploadedFiles = req.files || [];
        // Loop through variants
        for (let i = 0; i < variantsData.length; i++) {
            const variant = variantsData[i];
            if (variant.id) {
                // Existing variant -> update
                await prisma_1.default.productVariant.update({
                    where: { id: variant.id },
                    data: {
                        color: variant.color,
                        size: variant.size,
                        SKU: variant.SKU,
                        price: Number(variant.price),
                        stock: Number(variant.stock),
                    },
                });
                // Handle preserved images
                const preservedImageIds = variant.images
                    .filter((img) => img.id) // keep existing
                    .map((img) => img.id);
                // Delete removed images
                await prisma_1.default.productImage.deleteMany({
                    where: {
                        productVariantId: variant.id,
                        id: { notIn: preservedImageIds },
                    },
                });
                // Handle new uploads for this variant
                const filesForVariant = uploadedFiles.filter((f) => f.fieldname === `variantImages_${i}`);
                for (const file of filesForVariant) {
                    await prisma_1.default.productImage.create({
                        data: {
                            url: `/uploads/products/images/${file.filename}`,
                            productVariantId: variant.id,
                        },
                    });
                }
            }
            else {
                // New variant -> create
                const newVariant = await prisma_1.default.productVariant.create({
                    data: {
                        productId: Number(id),
                        color: variant.color,
                        size: variant.size,
                        SKU: variant.SKU,
                        price: Number(variant.price),
                        stock: Number(variant.stock),
                    },
                });
                // Handle uploads for new variant
                const filesForVariant = uploadedFiles.filter((f) => f.fieldname === `variantImages_${i}`);
                for (const file of filesForVariant) {
                    await prisma_1.default.productImage.create({
                        data: {
                            url: `/uploads/products/images/${file.filename}`,
                            productVariantId: newVariant.id,
                        },
                    });
                }
            }
        }
        res.json({ success: true, message: "Product updated successfully" });
    }
    catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.updateProductImage = updateProductImage;
const updateProductVideo = async (req, res) => {
    const { files } = req;
    const productid = Number(req.params.id);
    try {
        const { vendorId, name, description, longDescription, categoryId, subCategoryId, brandId, materialId, originId
        // This will be an array from the formData 
         } = req.body;
        const user = req.user;
        const vendor = await prisma_1.default.vendor.findFirst({ where: { userId: parseInt(vendorId) } });
        if (!vendor) {
            if (!user?.email.toString().includes("huzaifeeyunus")) {
                return res.status(403).json({ message: "Not a vendor." });
            }
        }
        const product = await prisma_1.default.product.update({
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
            await Promise.all(videoFiles.map(file => prisma_1.default.productVideo.create({
                data: {
                    productId: productid,
                    url: `/uploads/products/videos/${file.filename}`,
                },
            })));
        }
        // Step 4 — return full product
        const fullProduct = await prisma_1.default.product.findUnique({
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
    }
    catch (err) {
        console.error("Error updating product video:", err);
        res.status(500).json({ message: "Failed to update product video.", error: err });
    }
};
exports.updateProductVideo = updateProductVideo;
const updateProduct = async (req, res) => {
    //const { files } = req as Request & { files: MulterFiles };
    const id = req.params.id;
    try {
        const { vendorId, name, description, longDescription, price, stock, categoryId, subCategoryId, brandId, materialId, originId, tag, variants
        // This will be an array from the formData 
         } = req.body;
        const user = req.user;
        let slug = (0, randomnames_middleware_1.generateSKU)(name);
        if (!subCategoryId || !categoryId) {
            return res.status(400).json({ message: "Missing category or subcategory." });
        }
        const vendor = await prisma_1.default.vendor.findFirst({ where: { userId: parseInt(vendorId) } });
        if (!vendor) {
            if (!user?.email.toString().includes("huzaifeeyunus@gmail.com")) {
                return res.status(403).json({ message: "Not a vendor." });
            }
        }
        // Step 1 — create main product
        const product = await prisma_1.default.product.update({
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
        const fullProduct = await prisma_1.default.product.findUnique({
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
    }
    catch (err) {
        console.error("Error update product:", err);
        res.status(500).json({ message: "Failed to update product.", error: err });
    }
};
exports.updateProduct = updateProduct;
// Delete Product
const deleteProduct = async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    try {
        const vendor = await prisma_1.default.vendor.findUnique({
            where: { userId: user?.id },
        });
        if (!vendor) {
            if (!user?.email.startsWith("huzaifeeyunus")) {
                return res.status(403).json({ message: "Not a vendor." });
            }
        }
        await prisma_1.default.productImage.deleteMany({ where: { productVariantId: parseInt(id) } });
        await prisma_1.default.productVariant.deleteMany({ where: { productId: parseInt(id) } });
        await prisma_1.default.product.delete({ where: { id: parseInt(id) } });
        res.json({ message: "Product deleted." });
    }
    catch (err) {
        console.error("Error update product:", err);
        res.status(500).json({ message: "Failed to delete product." });
    }
};
exports.deleteProduct = deleteProduct;
