"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrderPayment = void 0;
const validateOrderPayment = (req, res, next) => {
    const { paymentMethod, paymentRef } = req.body;
    if (!paymentMethod)
        return res.status(400).json({ error: "Payment method required" });
    next();
};
exports.validateOrderPayment = validateOrderPayment;
