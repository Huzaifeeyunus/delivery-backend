import { Request, Response, NextFunction } from "express";

export const validateOrderPayment = (req: Request, res: Response, next: NextFunction) => {
  const { paymentMethod, paymentRef } = req.body;
  if (!paymentMethod) return res.status(400).json({ error: "Payment method required" });
  next();
};
