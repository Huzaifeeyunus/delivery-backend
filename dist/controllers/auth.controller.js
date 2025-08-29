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
    const { name, email, password, phone, shopName, shopPhone, shopLocation, shopAddress } = req.body;
    try {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        const role = "customer";
        // Hash password
        const passwordHash = await (0, hash_1.hashPassword)(password);
        // Create user
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                phone,
                role,
                passwordHash,
            },
        });
        // If vendor, create vendor profile
        const vrole = "customer";
        if (vrole === "vendor") {
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
                },
            });
        }
        const token = (0, jwt_1.generateToken)({ id: user.id, name: user.name, email: user.email, role: user.role });
        res.status(201).json({
            message: "User registered successfully",
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
    const loginuser = await prisma_1.default.user.findUnique({ where: { email } });
    if (!loginuser) {
        return res.status(401).json({ message: "Invalid email or password." });
    }
    const isMatch = await bcryptjs_1.default.compare(password, loginuser.passwordHash);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jsonwebtoken_1.default.sign({ id: loginuser.id, name: loginuser.name, email: loginuser.email, role: loginuser.role }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
    res.status(200).json({
        token,
        user: {
            id: loginuser.id,
            name: loginuser.name,
            email: loginuser.email,
            role: loginuser.role,
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
