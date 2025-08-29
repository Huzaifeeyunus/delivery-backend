"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.findUser = exports.getAllUser = exports.createUser = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Create Product
const createUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(400).json({ message: "Invalid user ID." });
        }
        const { name, email, passwordHash, phone, role, imageUrl } = req.body;
        // Prepare update object
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (phone)
            updateData.phone = phone;
        if (role)
            updateData.role = "customer";
        updateData.role = "customer";
        if (imageUrl)
            updateData.imageUrl = imageUrl;
        // Hash password only if provided and changed
        if (passwordHash && passwordHash.trim() !== "") {
            const hashedPassword = await bcryptjs_1.default.hash(passwordHash, 10);
            updateData.passwordHash = hashedPassword;
            console.log("Password changed");
        }
        const updatedUser = await prisma_1.default.user.create({
            data: updateData,
        });
        res.json({
            message: "User created successfully.",
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({
            message: "Failed to create user.",
            error: err instanceof Error ? err.message : err,
        });
    }
};
exports.createUser = createUser;
// Get All users
const getAllUser = async (_req, res) => {
    try {
        const users = await prisma_1.default.user.findMany();
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch users." });
    }
};
exports.getAllUser = getAllUser;
// Find A users
const findUser = async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch users." });
    }
};
exports.findUser = findUser;
// Update user
const updateUser = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found." });
        }
        const { name, email, passwordHash, phone, role, imageUrl } = req.body;
        // Prepare update object
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (phone)
            updateData.phone = phone;
        if (role)
            updateData.role = role;
        if (imageUrl)
            updateData.imageUrl = imageUrl;
        // Hash password only if provided and changed
        if (!passwordHash.includes("$2b")) {
            if (passwordHash && passwordHash.trim() !== "") {
                const hashedPassword = await bcryptjs_1.default.hash(passwordHash, 10);
                updateData.passwordHash = hashedPassword;
                console.log("Has changed__: ", updateData);
            }
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id },
            data: updateData,
        });
        res.json({
            message: "User updated successfully.",
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({
            message: "Failed to update user.",
            error: err instanceof Error ? err.message : err,
        });
    }
};
exports.updateUser = updateUser;
// Delete user
const deleteUser = async (req, res) => {
    const id = Number(req.params.id);
    const user = req.user;
    try {
        const _user = await prisma_1.default.user.findUnique({
            where: { id },
        });
        if (!_user)
            return res.status(403).json({ message: "Not a user." });
        await prisma_1.default.user.delete({ where: { id: id } });
        res.json({ message: "user deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete user." });
    }
};
exports.deleteUser = deleteUser;
