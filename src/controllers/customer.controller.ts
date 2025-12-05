import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

// Get customer profile
export const getCustomerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const customer = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        gender: true,
        createdAt: true,
        addresses: {
          select: {
            id: true,
            title: true,
            street: true,
            city: true,
            region: true,
            country: true,
            phone: true,
            isDefault: true,
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer profile',
      error: error.message,
    });
  }
};

// Get active orders count
export const getActiveOrdersCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const activeOrders = await prisma.order.findMany({
      where: {
        customerId: userId,
        OR: [
          { status: 'pending' },
          { status: 'accepted' },
          { status: 'preparing' },
          { status: 'picked' },
          { 
            AND: [
              { status: 'delivered' },
              { paymentStatus: { not: 'paid' } }
            ]
          }
        ]
      },
      select: { id: true }
    });

    res.status(200).json({
      success: true,
      count: activeOrders.length,
      data: activeOrders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active orders',
      error: error.message,
    });
  }
};

// Get cart items count
export const getCartItemsCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          select: {
            quantity: true
          }
        }
      }
    });

    const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    res.status(200).json({
      success: true,
      count: totalItems,
      data: { totalItems, cartId: cart?.id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart count',
      error: error.message,
    });
  }
};

// Get total spending
export const getTotalSpending = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const result = await prisma.order.aggregate({
      where: {
        customerId: userId,
        paymentStatus: 'paid',
        status: 'delivered'
      },
      _sum: {
        totalAmount: true
      }
    });

    const totalSpent = result._sum.totalAmount || 0;

    res.status(200).json({
      success: true,
      total: totalSpent,
      data: { totalSpent, currency: 'GHS' },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error calculating total spending',
      error: error.message,
    });
  }
};

// Get customer wishlist (using existing reviews as wishlist placeholder)
export const getCustomerWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    // Since we don't have wishlist model, use reviews as placeholder
    // or you can create a separate wishlist model
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discountPrice: true,
            stockStatus: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            vendor: {
              select: {
                shopName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      message: 'Using reviews as wishlist placeholder. Consider adding Wishlist model.',
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist data',
      error: error.message,
    });
  }
};

// Get customer reviews
export const getCustomerReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message,
    });
  }
};

// Get order history
export const getOrderHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, page = 1 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const whereCondition: any = { customerId: userId };
    
    if (status) {
      whereCondition.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereCondition,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
              variant: {
                include: {
                  color: true,
                },
              },
              size: true,
            },
          },
          vendor: {
            select: {
              id: true,
              shopName: true,
            },
          },
          delivery: true,
          payment: true,
          address: true,
        },
        orderBy: {
          placedAt: 'desc',
        },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({
        where: whereCondition,
      }),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: error.message,
    });
  }
};

// Get notifications (using log reports as placeholder)
export const getCustomerNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    // Using log reports as notifications placeholder
    const notifications = await prisma.logReport.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      message: 'Using log reports as notifications placeholder. Consider adding Notification model.',
      data: notifications,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

// Get support tickets (using order issues as placeholder)
export const getCustomerSupportTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    // Using orders with issues as support tickets placeholder
    const supportIssues = await prisma.order.findMany({
      where: {
        customerId: userId,
        OR: [
          { paymentError: { not: null } },
          { refundReason: { not: null } },
          { status: 'failed' },
          { status: 'cancelled' },
          { status: 'refunded' },
        ],
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        paymentError: true,
        refundReason: true,
        placedAt: true,
        items: {
          select: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        placedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      count: supportIssues.length,
      message: 'Using order issues as support tickets placeholder. Consider adding SupportTicket model.',
      data: supportIssues,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets',
      error: error.message,
    });
  }
};