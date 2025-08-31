import { Router } from "express";
import {
  createLogReport,
  getAllLogReports,
  getLogReport,
  updateLogReport,
  deleteLogReport,
} from "../controllers/logreport.controller";
import { protect } from "../controllers/auth.controller";

const router = Router();

router.post("/", protect, createLogReport);
router.get("/", protect, getAllLogReports);
router.get("/:id", protect, getLogReport);
router.put("/:id", protect, updateLogReport);
router.delete("/:id", protect, deleteLogReport);

export default router;
