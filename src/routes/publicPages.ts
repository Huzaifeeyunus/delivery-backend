import express from "express"; 
import prisma from "../lib/prisma";

const router = express.Router();

// ========== PublicPages ==========
router.get("/", async (req, res) => {
  const pages = await prisma.publicPage.findMany({
    include: { PageOrigin: { include: { OriginImage: true } } },
  });
  res.json(pages);
});

router.get("/:id", async (req, res) => {
  const page = await prisma.publicPage.findUnique({
    where: { id: Number(req.params.id) },
    include: { PageOrigin: { include: { OriginImage: true } } },
  });
  res.json(page);
});

router.post("/", async (req, res) => {
  const { slug, title, description, showInHeader, showInFooter, isVisible } = req.body;
  const page = await prisma.publicPage.create({
    data: { slug, title, description, showInHeader, showInFooter, isVisible },
  });
  res.json(page);
});

router.put("/:id", async (req, res) => {
  const { slug, title, description } = req.body;
  const page = await prisma.publicPage.update({
    where: { id: Number(req.params.id) },
    data: { slug, title, description },
  });
  res.json(page);
});

router.delete("/:id", async (req, res) => {
  await prisma.publicPage.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

// ========== PageOrigins ==========
router.get("/:pageId/origins", async (req, res) => {
  const origins = await prisma.pageOrigin.findMany({
    where: { publicPageId: Number(req.params.pageId) },
    include: { OriginImage: true },
  });
  res.json(origins);
});

router.post("/:pageId/origins", async (req, res) => {
  const { title, description } = req.body;
  const origin = await prisma.pageOrigin.create({
    data: {
      title,
      description,
      publicPageId: Number(req.params.pageId),
    },
  });
  res.json(origin);
});

router.put("/origins/:id", async (req, res) => {
  const { title, description } = req.body;
  const origin = await prisma.pageOrigin.update({
    where: { id: Number(req.params.id) },
    data: { title, description },
  });
  res.json(origin);
});

router.delete("/origins/:id", async (req, res) => {
  await prisma.pageOrigin.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

// ========== OriginImages ==========
router.post("/origins/:originId/images", async (req, res) => {
  const { imageUrl } = req.body;
  const image = await prisma.originImage.create({
    data: { imageUrl, pageOriginId: Number(req.params.originId) },
  });
  res.json(image);
});

router.delete("/images/:id", async (req, res) => {
  await prisma.originImage.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

export default router;
