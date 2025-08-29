import { Router } from "express";
import {
  createUser,
  getAllUser,
  findUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { protect } from "../controllers/auth.controller";

import { createUploader } from "../middlewares/upload.middleware";

  
const router = Router();

const uploader = createUploader();


router.post("/", protect, uploader.none(), createUser);       // Create product
router.get("/", protect, getAllUser);                   // List all products
router.get("/:id", protect, findUser);                // Update product
router.put("/:id", protect, uploader.none(), updateUser);     // Update product
router.delete("/:id", protect, deleteUser);  // Delete product


export default router;
