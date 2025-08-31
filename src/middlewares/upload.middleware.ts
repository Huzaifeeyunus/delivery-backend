
// src/middlewares/upload.middleware.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

export function createUploader() {
  const baseUploads = path.join(__dirname, "../../uploads");

  const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
      let subfolder = "misc";

      // --- Image Slider Uploads ---
      if (req.baseUrl.includes("imagesliders")) {
        if (file.mimetype.startsWith("image/")) {
          subfolder = "images/slider/images";
        } else if (file.mimetype.startsWith("video/")) {
          subfolder = "images/slider/videos";
        }
      }

      // --- User Uploads (avatars, profile images) ---
      else if (req.baseUrl.includes("users")) {
        if (file.mimetype.startsWith("image/")) {
          subfolder = "users/images";
        } else {
          subfolder = "users/others";
        }
      }

      // --- Product Uploads (old logic, preserved) ---
      else {
        if (
          file.fieldname === "images" ||
          /^variantImages_/.test(file.fieldname) ||
          file.mimetype.startsWith("image/")
        ) {
          subfolder = "products/images";
        } else if (file.fieldname === "videos" || file.mimetype.startsWith("video/")) {
          subfolder = "products/videos";
        } else {
          subfolder = "products/others";
        }
      }

      const uploadDir = path.join(baseUploads, subfolder);
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },

    filename: (req: Request, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

  return multer({ storage });
}



























/* 
// src/middlewares/upload.middleware.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

export function createUploader() {
  const baseUploads = path.join(__dirname, "../../uploads");

  const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
      // decide folder by fieldname OR mimetype
      let subfolder = "misc";

      if (file.fieldname === "images" || /^variantImages_/.test(file.fieldname) || file.mimetype.startsWith("image/")) {
        subfolder = "products/images";
      } else if (file.fieldname === "videos" || file.mimetype.startsWith("video/")) {
        subfolder = "products/videos";
      } else {
        subfolder = "products/others";
      }

      const uploadDir = path.join(baseUploads, subfolder);
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },

    filename: (req: Request, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

  return multer({ storage });
}


/* 
import { Request } from "express"; 
import multer, { diskStorage } from "multer";
import path from "path";
import fs from "fs";

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

export default upload;
 */



/* 

import { Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

export function createUploader(subfolder: string) {
  const uploadDir = path.join(__dirname, "../../uploads", subfolder);

  // Ensure the upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure storage
  const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req: Request, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  return multer({ storage });
}

 */ 