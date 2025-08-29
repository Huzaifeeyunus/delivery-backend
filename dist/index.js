"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const subcategory_routes_1 = __importDefault(require("./routes/subcategory.routes"));
const brand_routes_1 = __importDefault(require("./routes/brand.routes"));
const color_routes_1 = __importDefault(require("./routes/color.routes"));
const material_routes_1 = __importDefault(require("./routes/material.routes"));
const origin_routes_1 = __importDefault(require("./routes/origin.routes"));
const size_routes_1 = __importDefault(require("./routes/size.routes"));
const tag_routes_1 = __importDefault(require("./routes/tag.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const delivery_routes_1 = __importDefault(require("./routes/delivery.routes"));
const address_routes_1 = __importDefault(require("./routes/address.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const vendor_routes_1 = __importDefault(require("./routes/vendor.routes"));
const imageslider_routes_1 = __importDefault(require("./routes/imageslider.routes"));
const videoslider_routes_1 = __importDefault(require("./routes/videoslider.routes"));
// ----------------------
// Fallback Logger Setup
// ----------------------
const logDir = path_1.default.join(__dirname, "logs");
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const logFile = path_1.default.join(logDir, "app.log");
function writeLog(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs_1.default.appendFileSync(logFile, line, "utf8");
}
// Uncaught errors
process.on("uncaughtException", (err) => {
    writeLog(`Uncaught Exception: ${err.stack || err.message}`);
});
// Unhandled promise rejections
process.on("unhandledRejection", (reason) => {
    writeLog(`Unhandled Rejection: ${reason}`);
});
// ----------------------
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 4000;
const BASE_URL = process.env.VITE_BASE_URL || `http://localhost:${PORT}`;
// Static uploads folder
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// Serve static files from public
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// CORS setup
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173", // dev
        "https://rashforshort.com", // production
        "https://www.rashforshort.com", // production
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.disable("x-powered-by");
// JSON middleware (skip multipart)
app.use((req, res, next) => {
    if (req.is("multipart/form-data"))
        return next();
    express_1.default.json()(req, res, next);
});
// Health check
app.get("/", (_req, res) => {
    res.send("Delivery API is running!");
});
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "public", "favicon.ico"));
});
// List slider images
app.get("/api/images/slider", (_req, res) => {
    const sliderPath = path_1.default.join(process.cwd(), "uploads/images/slider");
    if (!fs_1.default.existsSync(sliderPath))
        return res.json([]);
    const files = fs_1.default.readdirSync(sliderPath);
    const urls = files.map((f) => `/uploads/images/slider/${f}`);
    res.json(urls);
});
// List all logo
app.get("/api/images/logo", (_req, res) => {
    const imagesPath = path_1.default.join(process.cwd(), "uploads/images/logo");
    if (!fs_1.default.existsSync(imagesPath))
        return res.json([]);
    const files = fs_1.default.readdirSync(imagesPath);
    const urls = files.map((f) => `/uploads/images/logo/${f}`); // relative paths
    res.json(urls);
});
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/vendors", vendor_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/subcategories", subcategory_routes_1.default);
app.use("/api/brands", brand_routes_1.default);
app.use("/api/colors", color_routes_1.default);
app.use("/api/materials", material_routes_1.default);
app.use("/api/origins", origin_routes_1.default);
app.use("/api/sizes", size_routes_1.default);
app.use("/api/tags", tag_routes_1.default);
app.use("/api/carts", cart_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/deliveries", delivery_routes_1.default);
app.use("/api/addresses", address_routes_1.default);
app.use("/api/imagesliders", imageslider_routes_1.default);
app.use("/api/videosliders", videoslider_routes_1.default);
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
