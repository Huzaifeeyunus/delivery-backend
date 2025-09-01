import path from "path";
import fs from "fs";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import logReportRoutes from "./routes/logreport.routes";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoriesRoutes from "./routes/category.routes";
import subcategoriesRoutes from "./routes/subcategory.routes";
import brandsRoutes from "./routes/brand.routes";
import colorsRoutes from "./routes/color.routes";
import materialsRoutes from "./routes/material.routes";
import originsRoutes from "./routes/origin.routes";
import sizesRoutes from "./routes/size.routes";
import tagsRoutes from "./routes/tag.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import deliveryRoutes from "./routes/delivery.routes";
import addressRoutes from "./routes/address.routes";
import adminRoutes from "./routes/admin.routes";
import userRoutes from "./routes/user.routes";
import roleRoutes from "./routes/roles.routes";
import vendorRoutes from "./routes/vendor.routes";
import imageRoutes from "./routes/imageslider.routes";
import videoRoutes from "./routes/videoslider.routes"; 

// ----------------------
// Fallback Logger Setup
// ----------------------
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, "app.log");

function writeLog(message:string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, line, "utf8");
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

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const BASE_URL = process.env.VITE_BASE_URL || `http://localhost:${PORT}`;

// Static uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Serve static files from public
app.use(express.static(path.join(__dirname, "public"))); 

// CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173", // dev
      "https://rashforshort.com", // production
      "https://www.rashforshort.com", // production
    ], 
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  })
);

app.use(helmet());
app.disable("x-powered-by");

// JSON middleware (skip multipart)
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) return next();
  express.json()(req, res, next);
});

// Health check
app.get("/", (_req, res) => {
  res.send("Delivery API is running!");
});
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

// List slider images
app.get("/api/product/images/", (_req, res) => {
  const sliderPath = path.join(process.cwd(), "uploads/products/images/");
  if (!fs.existsSync(sliderPath)) return res.json([]);
  const files = fs.readdirSync(sliderPath);
  const urls = files.map((f) => `/uploads/products/images/${f}`);
  res.json(urls);
});
app.get("/api/products/images/", (_req, res) => {
  const sliderPath = path.join(process.cwd(), "uploads/products/images/");
  if (!fs.existsSync(sliderPath)) return res.json([]);
  const files = fs.readdirSync(sliderPath);
  const urls = files.map((f) => `/uploads/products/images/${f}`);
  res.json(urls);
});

// List all products
app.get("/api/images/slider/images", (_req, res) => {
  const sliderPath = path.join(process.cwd(), "uploads/images/slider/images");
  if (!fs.existsSync(sliderPath)) return res.json([]);
  const files = fs.readdirSync(sliderPath);
  const urls = files.map((f) => `/uploads/images/slider/images/${f}`);
  res.json(urls);
});

// List all users
app.get("/api/users/images/", (_req, res) => {
  const sliderPath = path.join(process.cwd(), "uploads/users/images/");
  if (!fs.existsSync(sliderPath)) return res.json([]);
  const files = fs.readdirSync(sliderPath);
  const urls = files.map((f) => `/uploads/users/images/${f}`);
  res.json(urls);
});

// List all vendors
app.get("/api/vendors/images/", (_req, res) => {
  const sliderPath = path.join(process.cwd(), "uploads/vendors/images/");
  if (!fs.existsSync(sliderPath)) return res.json([]);
  const files = fs.readdirSync(sliderPath);
  const urls = files.map((f) => `/uploads/vendors/images/${f}`);
  res.json(urls);
});
// List all logo
app.get("/api/images/logo", (_req, res) => {
  const imagesPath = path.join(process.cwd(), "uploads/images/logo");
  if (!fs.existsSync(imagesPath)) return res.json([]);
  const files = fs.readdirSync(imagesPath);
  const urls = files.map((f) => `/uploads/images/logo/${f}`); // relative paths
  res.json(urls);
}); 
 
// Routes
//app.use(withUserContext);

app.use("/api/logreports", logReportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/colors", colorsRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/origins", originsRoutes);
app.use("/api/sizes", sizesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/orders", orderRoutes); 
app.use("/api/payments", paymentRoutes); 
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/imagesliders", imageRoutes);
app.use("/api/videosliders", videoRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
