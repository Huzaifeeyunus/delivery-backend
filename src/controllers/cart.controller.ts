import { Request, Response } from "express";
import prisma from "../lib/prisma";     
const haversine = require("haversine-distance");

const SHOP_LOCATION = { latitude: 9.437, longitude: -0.853 };

// ✅ FIXED: Add to Cart with proper existing item check
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const { productId, variantId, sizeId, quantity = 1 } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: "Product and quantity are required" });
    }

    // Fetch product with variants and sizes
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { 
        variants: { 
          include: { 
            sizes: {
              include: {
                size: true
              }
            } 
          } 
        } 
      },
    });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let price = product.price ?? 0;
    let finalSizeId = null;

    // Variant + size logic
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { 
          sizes: { 
            include: { 
              size: true 
            } 
          } 
        },
      });
      
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      if (variant.sizes.length > 0) {
        if (!sizeId) {
          return res.status(400).json({ message: "Size selection is required" });
        }
        
        const sizeObj = variant.sizes.find((s) => s.sizeId === sizeId);
        if (!sizeObj) {
          return res.status(400).json({ message: "Size not available" });
        }
        
        price = sizeObj.price;
        finalSizeId = sizeObj.id;
      } else {
        price = variant.price ?? product.price ?? price;
      }
    }

    // Get or create cart
    let cart = await prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // ✅ FIXED: Check if the exact same item already exists in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
        variantId: variantId || null,
        sizeId: finalSizeId || null,
      },
    });

    let cartItem;
    let isNewItem = false;

    if (existingCartItem) {
      // ✅ Update existing item quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { 
          quantity: existingCartItem.quantity + quantity,
          price: price // Update price in case it changed
        },
      });
      console.log("✅ Updated existing cart item:", cartItem.id, "New quantity:", cartItem.quantity);
    } else {
      // ✅ Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          productId,
          price,
          sizeId: finalSizeId,
          cartId: cart.id,
          quantity,
          variantId: variantId || null,
        },
      });
      isNewItem = true;
      console.log("✅ Created new cart item:", cartItem.id);
    }

    // Return complete updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: { 
              select: { 
                id: true,
                name: true,
                images: true 
              } 
            },
            variant: { 
              select: { 
                id: true,
                color: true 
              } 
            },
            size: { 
              select: { 
                id: true,
                size: true 
              } 
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return res.status(200).json({ 
      message: isNewItem ? "Item added to cart" : "Cart item quantity updated",
      item: cartItem,
      cart: updatedCart,
      totalItems: updatedCart?.items?.length || 0,
      isNewItem: isNewItem
    });
    
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get User Cart
export const getUserCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
 
    // Handle ADMIN fetching all carts
    if (user?.role?.name?.toString().toLowerCase() === "admin") {
      const carts = await prisma.cart.findMany({
        include: {
          user: true,
          items: { 
            include: { 
              product: true, 
              variant: {
                include: {
                  color: true,
                  sizes: true
                }
              },
              size: {
                include: {
                  size: true
                }
              }
            } 
          },
        },
      });
      return res.json({ carts });
    }
 
    // Normal user fetching own cart
    const userId = Number(user.id);
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: { 
          include: { 
            product: { 
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                images: true
              }
            }, 
            variant: {
              include: {
                color: true,
                sizes: {
                  include: {
                    size: true
                  }
                }
              }
            },
            size: {
              include: {
                size: true
              }
            }
          } 
        },
      },
    });
 
    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ 
        message: "Cart is empty", 
        cart: null,
        totals: { subtotal: 0, shipping: 0, total: 0 },
        warnings: []
      });
    }

    // Find default address
    const defaultAddress = await prisma.address.findFirst({
      where: { userId, isDefault: true },
    });
 
    let shippingCost = 0;
    const warnings: string[] = [];
    
    if (!defaultAddress) {
      warnings.push("⚠️ No default address found. Please set one before checkout.");
    } else {
      const userLocation = {
        latitude: defaultAddress.latitude!,
        longitude: defaultAddress.longitude!,
      };

      const distanceMeters = haversine(SHOP_LOCATION, userLocation);
      const distanceKm = distanceMeters / 1000;
      shippingCost = Math.max(10, distanceKm * 2);
    }
 
    // Apply 3-level fallback system for prices and stock
    let subtotal = 0;
    const adjustedItems = cart.items.map((item: any) => {
      let warning = null;

      // 3-LEVEL FALLBACK SYSTEM
      let unitPrice = item.product?.price ?? 0;
      let availableStock = item.product?.stock ?? 0;
      
      if (item.sizeId && item.size) {
        unitPrice = item.size.price ?? unitPrice;
        availableStock = item.size.stock ?? availableStock;
      } else if (item.variantId && item.variant) {
        unitPrice = item.variant.price ?? unitPrice;
        availableStock = item.variant.stock ?? availableStock;
      }

      // Validate stock
      if (availableStock === 0) {
        warning = `❌ ${item.product.name} is out of stock. Please remove from cart.`;
      } else if (item.quantity > availableStock) {
        warning = `⚠️ ${item.product.name} only ${availableStock} available. Please adjust quantity.`;
      }

      subtotal += unitPrice * item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        price: item.price,
        unitPrice,
        availableStock,
        warning,
        product: item.product,
        variant: item.variant,
        size: item.size,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    });
 
    const total = subtotal + shippingCost;
 
    return res.json({
      cart: { ...cart, items: adjustedItems },
      address: defaultAddress ?? null,
      totals: { subtotal, shipping: shippingCost, total },
      warnings,
    });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

// ✅ Update Cart Item Quantity
export const updateCartItemQty = async (req: Request, res: Response) => {
  try { 
    const userId = Number(req.user?.id);
    const itemId = Number(req.params.itemId);
    const { quantity } = req.body;
 
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    // Check if item belongs to user's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: { 
        id: itemId, 
        cart: { userId } 
      },
      include: {
        product: true,
        variant: true,
        size: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Check stock availability
    let availableStock = cartItem.product.stock;
    if (cartItem.sizeId && cartItem.size) {
      availableStock = cartItem.size.stock ?? availableStock;
    } else if (cartItem.variantId && cartItem.variant) {
      availableStock = cartItem.variant.stock ?? availableStock;
    }

    if (quantity > availableStock) {
      return res.status(400).json({ 
        error: `Only ${availableStock} units available in stock` 
      });
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: { select: { name: true } },
        variant: { select: { id: true, color: true } },
        size: { select: { id: true, size: true } }
      }
    });

    res.json({ 
      success: true, 
      item: updatedItem,
      message: "Quantity updated successfully"
    });
  } catch (err) {
    console.error("Update cart item error:", err);
    res.status(500).json({ error: "Failed to update cart item" });
  }
};

// ✅ Remove Cart Item
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const itemId = Number(req.params.cartId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if the cart item exists and belongs to the user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId: userId }
      },
      include: {
        cart: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await prisma.cartItem.delete({ 
      where: { id: itemId } 
    });

    return res.json({ 
      success: true,
      message: "Item removed successfully",
      removedItemId: itemId
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return res.status(500).json({ error: "Failed to remove item from cart" });
  }
};

// ✅ Clear Cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cart = await prisma.cart.findFirst({ 
      where: { userId } 
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const deleteResult = await prisma.cartItem.deleteMany({ 
      where: { cartId: cart.id } 
    });

    return res.json({ 
      success: true,
      message: "Cart cleared successfully",
      itemsRemoved: deleteResult.count
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({ error: "Failed to clear cart" });
  }
};

// ✅ Get All Carts (Admin only)
export const getAllCart = async (req: Request, res: Response) => {
  try { 
    const user = req.user as any;

    if (!user?.email?.includes("huzaifeeyunus@")) {
      return res.status(403).json({ message: "Unauthorized - Admin access only" });
    }

    const carts = await prisma.cart.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
            size: true
          },
        },
      },
    });

    res.json({ carts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch carts" });
  }
};

// ✅ Get Single Cart Item
export const getItemCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cartId = Number(req.params.cartid);

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const cart = await prisma.cart.findFirst({
      where: { 
        id: cartId,
        ...(user.role?.name?.toString().toLowerCase() !== "admin" ? { userId: Number(user.id) } : {})
      },
      include: {
        items: { 
          include: { 
            product: true, 
            variant: true,
            size: true
          } 
        },
      },
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.json({ cart });
  } catch (err) {
    console.error("getItemCart error:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

// ✅ Update Cart (Legacy - consider removing if not used)
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const { quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cart = await prisma.cart.findFirst({
      where: { userId }
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // This is a simple update - consider using updateCartItemQty instead
    res.json({ 
      success: true, 
      message: "Cart updated (legacy function)" 
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
};