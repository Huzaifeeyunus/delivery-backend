import { Router } from "express";
import {
  getPages,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
} from "../controllers/publicPageController";

const router = Router();

router.get("/", getPages);
router.get("/:slug", getPageBySlug);
router.post("/", createPage);
router.put("/:id", updatePage);
router.delete("/:id", deletePage);

export default router;
