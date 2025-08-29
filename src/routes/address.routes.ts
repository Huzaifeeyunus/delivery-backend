import { Router } from "express";
import {
  createAddress, getUserAddresses, setDefaultAddress, editAddress ,deleteAddress ,
} from "../controllers/address.controller"; 
import { protect } from "../controllers/auth.controller";

const router = Router();

router.post("/", protect, createAddress);
router.get("/", protect, getUserAddresses);
router.get("/default/:id", protect, setDefaultAddress );
//router.put("/:id", authenticate, updateAddress);
router.patch("/:id/default", protect, setDefaultAddress);
router.put("/:id", protect, editAddress);
router.delete("/:id", protect, deleteAddress);

export default router;
