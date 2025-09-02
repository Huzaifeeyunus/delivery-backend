"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = exports.protect = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await prisma_1.default.user.findUnique({ where: { id: decoded.id } });
            if (!user)
                return res.status(401).json({ error: "User not found" });
            req.user = user; // ✅ attach user to request
            return next();
        }
        catch (err) {
            console.error("JWT error:", err);
            return res.status(401).json({ error: "Not authorized, token failed" });
        }
    }
    return res.status(401).json({ error: "Not authorized, no token" });
};
exports.protect = protect;
const register = async (req, res) => {
    const { name, email, password, phone, shopName, shopPhone, shopLocation, shopAddress, licenseNumber, vehicleType, vehiclePlate, agentAddress, nationalId, dateOfBirth, emergencyContactName, emergencyContactPhone, region, type = "customer", // default
     } = req.body;
    try {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        // Hash password
        const passwordHash = await (0, hash_1.hashPassword)(password);
        // Decide role
        let role = "customer";
        if (type === "vendor")
            role = "vendor";
        if (type === "delivery")
            role = "delivery";
        // Create user (vendors & delivery start as inactive)
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                phone,
                role,
                passwordHash,
                //isActive: role === "customer", // only customers active immediately
            },
        });
        // If vendor, create vendor profile
        if (role === "vendor") {
            if (!shopName || !shopAddress) {
                return res.status(400).json({ message: "Vendor must provide shop name and address" });
            }
            await prisma_1.default.vendor.create({
                data: {
                    userId: user.id,
                    shopName,
                    shopPhone,
                    shopLocation,
                    shopAddress,
                    isActive: false, // pending admin approval
                },
            });
        }
        // If delivery, create delivery profile
        if (role === "delivery") {
            if (!licenseNumber || !vehicleType || !vehiclePlate || !agentAddress) {
                return res.status(400).json({ message: "Delivery agent must provide full details" });
            }
            await prisma_1.default.deliveryAgent.create({
                data: {
                    userId: user.id,
                    licenseNumber,
                    vehicleType,
                    vehiclePlate,
                    agentAddress,
                    nationalId,
                    dateOfBirth,
                    emergencyContactName,
                    emergencyContactPhone,
                    region,
                    isActive: false, // pending admin approval
                },
            });
        }
        // Generate token (customers only; vendors & delivery must wait for approval)
        const token = role === "customer"
            ? (0, jwt_1.generateToken)({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            })
            : null;
        res.status(201).json({
            message: role === "customer"
                ? "User registered successfully"
                : "Registration submitted, pending admin approval",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    const loginuser = await prisma_1.default.user.findUnique({ where: { email }, include: { roles: true } });
    if (!loginuser) {
        return res.status(401).json({ message: "Invalid email or password." });
    }
    const isMatch = await bcryptjs_1.default.compare(password, loginuser.passwordHash);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
    }
    const roles = await prisma_1.default.role.findUnique({ where: { id: loginuser.roles?.[0].roleId } });
    const token = jsonwebtoken_1.default.sign({ id: loginuser.id, name: loginuser.name, email: loginuser.email, role: roles }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
    res.status(200).json({
        token,
        user: {
            id: loginuser.id,
            name: loginuser.name,
            email: loginuser.email,
            role: roles,
        },
    });
};
exports.login = login;
// Token blacklist (in-memory for now; replace with Redis/DB for persistence)
let tokenBlacklist = [];
// Logout Controller
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }
        // Add token to blacklist (this only works until server restarts; use Redis/DB for production)
        tokenBlacklist.push(token);
        res.clearCookie('token'); // or your session cookie
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.logout = logout;
