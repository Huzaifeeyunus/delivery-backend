// utils/logger.ts 

import prisma from "../lib/prisma";

type LogLevel = "info" | "warning" | "error";

export async function logReport({
  title,
  message,
  level = "info",
  userId,
  orderId,
  productId,
  vendorId,
}: {
  title: string;
  message: string;
  level?: LogLevel;
  userId?: number;
  orderId?: number;
  productId?: number;
  vendorId?: number;
}) {
  try {
    await prisma.logReport.create({
      data: {
        title,
        message,
        level,
        userId,
        orderId,
        productId,
        vendorId,
      },
    });
  } catch (err) {
    console.error("Failed to write log:", err);
  }
}
