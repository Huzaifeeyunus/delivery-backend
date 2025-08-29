"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeCartItem = exports.updateCartItemQty = exports.updateCartItem = exports.getItemCart = exports.getUserCart = exports.getAllCart = exports.prevGetAllCart = exports.updateCartQuantity = exports.addToCart = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
//import { calculateShippingCost } from "../utils/shipping";
//import { calculateDistanceKm, calculateShippingFee } from "../utils/shipping";
//import haversine from "haversine-distance";
const haversine = require("haversine-distance");
// Add item to cart (with variant support)
const addToCart = async (req, res) => {
    try {
        const userId = Number(req.user?.id); // assuming user is authenticated 
        const { productId, variantId, quantity } = req.body;
        if (!productId || !quantity) {
            return res.status(400).json({ message: "Product and quantity are required" });
        }
        // ✅ Check if product exists
        const product = await prisma_1.default.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                stock: true,
                name: true,
                variants: {
                    where: { id: variantId || undefined },
                    select: { id: true, stock: true },
                },
            },
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        // ✅ If variantId is provided, check it
        let variant = null;
        if (variantId) {
            variant = await prisma_1.default.productVariant.findUnique({
                where: { id: variantId },
            });
            if (!variant) {
                return res.status(404).json({ message: "Variant not found" });
            }
        }
        // ✅ Get or create cart for user
        let cart = await prisma_1.default.cart.findFirst({
            where: { userId },
            include: { items: true },
        });
        if (!cart) {
            cart = await prisma_1.default.cart.create({
                data: { userId },
                include: { items: true },
            });
        }
        // ✅ Check if item already exists in cart (same product + variant)
        const existingItem = await prisma_1.default.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId,
                variantId: variantId || null,
            },
        });
        if (existingItem) {
            // Update quantity
            const updatedItem = await prisma_1.default.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity,
                },
            });
            return res.json({ message: "Cart updated", item: updatedItem });
        }
        else {
            // Add new item
            const newItem = await prisma_1.default.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    variantId: variantId || null,
                    quantity,
                    price: variant ? variant.price : 0, // ✅ use variant price if exists
                },
            });
            return res.json({ message: "Item added to cart", item: newItem });
        }
    }
    catch (error) {
        console.error("Error adding to cart:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.addToCart = addToCart;
// ✅ updateCartQuantity with stock validation
const updateCartQuantity = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { cartItemId, quantity } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!cartItemId || quantity === undefined) {
            return res.status(400).json({ message: "cartItemId and quantity are required" });
        }
        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
        }
        // Get the cart item
        const cartItem = await prisma_1.default.cartItem.findUnique({
            where: { id: cartItemId },
            include: { product: true },
        });
        if (!cartItem) {
            return res.status(404).json({ message: "Cart item not found" });
        }
        // ✅ Stock validation
        if (quantity > cartItem.product.stock) {
            return res.status(400).json({
                message: `Only ${cartItem.product.stock} units available in stock`,
            });
        }
        // Update cart item
        const updatedItem = await prisma_1.default.cartItem.update({
            where: { id: cartItemId },
            data: { quantity },
            include: { product: true },
        });
        res.json(updatedItem);
    }
    catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.updateCartQuantity = updateCartQuantity;
// Get All cart          
const prevGetAllCart = async (req, res) => {
    try {
        const user = req.user;
        ;
        // ✅ Only allow admin user (adjust your logic for roles later)
        if (!user?.email || !user?.email?.includes("huzaifeeyunus@")) {
            return res
                .status(403)
                .json({ message: "Unauthorized - Admin access only" });
        }
        // ✅ Fetch all carts with related items + products + users
        const carts = await prisma_1.default.cart.findMany({
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            carts,
        });
    }
    catch (err) {
        console.error("getAllCart error:", err);
        res.status(500).json({ error: "Failed to fetch carts" });
    }
};
exports.prevGetAllCart = prevGetAllCart;
const getAllCart = async (req, res) => {
    try {
        const user = req.user;
        ;
        // ✅ Only allow admin user (adjust your logic for roles later)
        if (!user?.email || !user?.email?.includes("huzaifeeyunus@")) {
            return res
                .status(403)
                .json({ message: "Unauthorized - Admin access only" });
        }
        // Fetch all carts with items + product details
        const carts = await prisma_1.default.cart.findMany({
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        // Process each cart like we did for a normal user
        const processedCarts = carts.map((cart) => {
            let subtotal = 0;
            let shippingFee = 0;
            const warnings = [];
            const items = cart.items.map((item) => {
                const product = item.product;
                let finalQty = item.quantity;
                let isAdjusted = false;
                if (product.stock < finalQty) {
                    warnings.push(`Product "${product.name}" stock was adjusted to ${product.stock}`);
                    finalQty = product.stock;
                    isAdjusted = true;
                }
                const total = finalQty * product.price;
                subtotal += total;
                return {
                    ...item,
                    quantity: finalQty,
                    total,
                    isAdjusted,
                };
            });
            if (subtotal > 0) {
                shippingFee = subtotal < 100 ? 10 : 0;
            }
            const grandTotal = subtotal + shippingFee;
            return {
                ...cart,
                items,
                subtotal,
                shippingFee,
                grandTotal,
                warnings,
            };
        });
        res.json({ carts: processedCarts });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch carts" });
    }
};
exports.getAllCart = getAllCart;
// Get user cart         
// cart.controller.ts 
const SHOP_LOCATION = { latitude: 9.437, longitude: -0.853 }; // Example: Tamale HQ
const getUserCart = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        // --- 1. Handle ADMIN fetching all carts ---
        if (user?.role?.toString().toLowerCase() === "admin") {
            const carts = await prisma_1.default.cart.findMany({
                include: {
                    user: true,
                    items: { include: { product: true, variant: true } },
                },
            });
            return res.json({ carts });
        }
        // --- 2. Normal user fetching own cart ---
        const userId = Number(user.id);
        const cart = await prisma_1.default.cart.findFirst({
            where: { userId },
            include: {
                items: { include: { product: true, variant: true } },
            },
        });
        if (!cart || cart.items.length === 0) {
            return res.status(200).json({ message: "Cart is empty", cart: null });
        }
        // --- 3. Find default address ---
        const defaultAddress = await prisma_1.default.address.findFirst({
            where: { userId, isDefault: true },
        });
        let shippingCost = 0;
        const warnings = [];
        if (!defaultAddress) {
            warnings.push("⚠️ No default address found. Please set one before checkout.");
        }
        else {
            const userLocation = {
                latitude: defaultAddress.latitude,
                longitude: defaultAddress.longitude,
            };
            const distanceMeters = haversine(SHOP_LOCATION, userLocation);
            const distanceKm = distanceMeters / 1000;
            shippingCost = Math.max(10, distanceKm * 2); // Example: GHS 2/km, min 10
        }
        // --- 4. Adjust stock + calculate totals (ALWAYS use variant) ---
        let subtotal = 0;
        const adjustedItems = await Promise.all(cart.items.map(async (item) => {
            let isAdjusted = false;
            // ✅ Only variant is used
            const stock = item.variant?.stock ?? 0;
            const unitPrice = item.variant?.price ?? 0;
            if (!item.variant) {
                warnings.push(`❌ ${item.product.name} has no valid variant and was removed.`);
                await prisma_1.default.cartItem.delete({ where: { id: item.id } });
                return null;
            }
            if (stock === 0) {
                await prisma_1.default.cartItem.delete({ where: { id: item.id } });
                warnings.push(`❌ ${item.product.name} (${item.variant.color} ${item.variant.size}) was removed (out of stock).`);
                return null;
            }
            else if (item.quantity > stock) {
                await prisma_1.default.cartItem.update({
                    where: { id: item.id },
                    data: { quantity: stock },
                });
                isAdjusted = true;
                warnings.push(`⚠️ ${item.product.name} (${item.variant.color} ${item.variant.size}) stock adjusted to ${stock}.`);
                item.quantity = stock;
            }
            subtotal += unitPrice * item.quantity;
            return {
                ...item,
                unitPrice,
                isAdjusted,
            };
        }));
        const finalItems = adjustedItems.filter((i) => i !== null);
        const total = subtotal + shippingCost;
        return res.json({
            cart: { ...cart, items: finalItems },
            address: defaultAddress ?? null,
            totals: { subtotal, shipping: shippingCost, total },
            warnings,
        });
    }
    catch (err) {
        console.error("getCart error:", err);
        res.status(500).json({ error: "Failed to fetch cart" });
    }
};
exports.getUserCart = getUserCart;
const getItemCart = async (req, res) => {
    try {
        const user = req.user;
        const itemid = req.params;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        // --- 1. Handle ADMIN fetching all carts ---
        if (user?.role?.toString().toLowerCase() === "admin") {
            const carts = await prisma_1.default.cart.findMany({
                include: {
                    user: true,
                    items: { include: { product: true, variant: true } },
                },
            });
            return res.json({ carts });
        }
        // --- 2. Normal user fetching own cart ---
        const userId = Number(user.id);
        const cart = await prisma_1.default.cart.findFirst({
            where: { userId },
            include: {
                items: { include: { product: true, variant: true } },
            },
        });
        if (!cart || cart.items.length === 0) {
            return res.status(200).json({ message: "Cart is empty", cart: null });
        }
        // --- 3. Find default address ---
        const defaultAddress = await prisma_1.default.address.findFirst({
            where: { userId, isDefault: true },
        });
        if (!defaultAddress) {
            return res.status(400).json({
                message: "No default address found. Please set one before checkout.",
                requiresDefaultAddress: true,
                cart,
            });
        }
        // --- 4. Shipping fee using haversine ---
        const userLocation = {
            latitude: defaultAddress.latitude,
            longitude: defaultAddress.longitude,
        };
        const distanceMeters = haversine(SHOP_LOCATION, userLocation);
        const distanceKm = distanceMeters / 1000;
        const shippingCost = Math.max(10, distanceKm * 2); // Example: GHS 2/km, min 10
        // --- 5. Adjust stock + calculate totals ---
        let subtotal = 0;
        const warnings = [];
        const adjustedItems = await Promise.all(cart.items.map(async (item) => {
            let isAdjusted = false;
            const availableStock = item.product.stock;
            if (availableStock === 0) {
                // Remove item completely
                await prisma_1.default.cartItem.delete({ where: { id: item.id } });
                warnings.push(`❌ ${item.product.name} was removed (out of stock).`);
                return null;
            }
            else if (item.quantity > availableStock) {
                // Reduce to available stock
                await prisma_1.default.cartItem.update({
                    where: { id: item.id },
                    data: { quantity: availableStock },
                });
                isAdjusted = true;
                warnings.push(`⚠️ ${item.product.name} stock adjusted to ${availableStock}.`);
                item.quantity = availableStock;
            }
            subtotal += item.product.price * item.quantity;
            return {
                ...item,
                isAdjusted,
            };
        }));
        const finalItems = adjustedItems.filter((i) => i !== null);
        const total = subtotal + shippingCost;
        return res.json({
            cart: { ...cart, items: finalItems },
            address: defaultAddress,
            totals: { subtotal, shipping: shippingCost, total },
            warnings,
        });
    }
    catch (err) {
        console.error("getCart error:", err);
        res.status(500).json({ error: "Failed to fetch cart" });
    }
};
exports.getItemCart = getItemCart;
// Update quantity
const updateCartItem = async (req, res) => {
    const cartItemId = Number(req.params.itemId);
    const { quantity } = req.body;
    await prisma_1.default.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
    });
    return res.json({ message: "Quantity updated" });
};
exports.updateCartItem = updateCartItem;
// src/controllers/cart.controller.ts 
const updateCartItemQty = async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        const { itemId } = req.params;
        const { quantity } = req.body;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        if (!quantity || quantity < 1)
            return res.status(400).json({ error: "Quantity must be >= 1" });
        // Check if item belongs to user's cart
        const cartItem = await prisma_1.default.cartItem.findFirst({
            where: { id: Number(itemId), cart: { userId } },
        });
        if (!cartItem)
            return res.status(404).json({ error: "Cart item not found" });
        // Update quantity
        const updatedItem = await prisma_1.default.cartItem.update({
            where: { id: Number(itemId) },
            data: { quantity },
        });
        res.json({ success: true, item: updatedItem });
    }
    catch (err) {
        console.error("Update cart item error:", err);
        res.status(500).json({ error: "Failed to update cart item" });
    }
};
exports.updateCartItemQty = updateCartItemQty;
// Remove item
const removeCartItem = async (req, res) => {
    const cartItemId = Number(req.params.itemId);
    await prisma_1.default.cartItem.delete({ where: { id: cartItemId } });
    return res.json({ message: "Item removed" });
};
exports.removeCartItem = removeCartItem;
// Clear cart
const clearCart = async (req, res) => {
    const userId = Number(req.params.userId);
    const cart = await prisma_1.default.cart.findFirst({ where: { userId } });
    if (!cart)
        return res.status(404).json({ error: "Cart not found" });
    await prisma_1.default.cartItem.deleteMany({ where: { cartId: cart.id } });
    return res.json({ message: "Cart cleared" });
};
exports.clearCart = clearCart;
