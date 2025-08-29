"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const delivery_controller_1 = require("../controllers/delivery.controller");
const router = (0, express_1.Router)();
router.patch("/:deliveryId", delivery_controller_1.updateDeliveryStatus);
exports.default = router;
