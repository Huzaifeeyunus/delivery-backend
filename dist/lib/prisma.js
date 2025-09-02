"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/lib/prisma.ts
//import { PrismaClient } from "@prisma/client"; 
//import { als } from "./requestContext";
const client_1 = require("@prisma/client");
//import { getRequestContext } from "./requestContext";
const prisma = new client_1.PrismaClient();
/*
(prisma as any).$use(async (params: any, next: (p: any) => Promise<any>) => {
  const result = await next(params);

  const { model, action, args } = params;
  const ctx = getRequestContext();

  // Only log for models we care about
  const modelsToLog = ["Product", "Order", "ImageSlider", "Vendor"];
  if (modelsToLog.includes(model) && ["create", "update", "delete"].includes(action)) {
    try {
      await prisma.logReport.create({
        data: {
          title: `${model}.${action}`,              // instead of "action"
          message: JSON.stringify(args),            // store args
          level: "info",                            // or "warning"/"error"
          userId: ctx?.userId ?? null,
          orderId: model === "Order" ? args?.where?.id ?? null : null,
          productId: model === "Product" ? args?.where?.id ?? null : null,
          vendorId: model === "Vendor" ? args?.where?.id ?? null : null,
        },
      });
    } catch (err) {
      console.error("Failed to write log report:", err);
    }
  }

  return result;
}); */
exports.default = prisma;
