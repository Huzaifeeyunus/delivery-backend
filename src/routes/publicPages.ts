import express from "express"; 
import prisma from "../lib/prisma";

const router = express.Router();

// ========== PublicPages ==========
router.get("/", async (req, res) => {
  const pages = await prisma.publicPage.findMany({
    include: { origins: { include: { images: true } } },
  });
  res.json(pages);
});

router.get("/:id", async (req, res) => {
  const page = await prisma.publicPage.findUnique({
    where: { id: Number(req.params.id) },
    include: { origins: { include: { images: true } } },
  });
  res.json(page);
});

router.post("/", async (req, res) => {
  const { slug, title, description } = req.body;
  const page = await prisma.publicPage.create({
    data: { slug, title, description },
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
  const origins = await prisma.publicPageOrigin.findMany({
    where: { publicPageId: Number(req.params.pageId) },
    include: { images: true },
  });
  res.json(origins);
});

router.post("/:pageId/origins", async (req, res) => {
  const { title, description } = req.body;
  const origin = await prisma.publicPageOrigin.create({
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
  const origin = await prisma.publicPageOrigin.update({
    where: { id: Number(req.params.id) },
    data: { title, description },
  });
  res.json(origin);
});

router.delete("/origins/:id", async (req, res) => {
  await prisma.publicPageOrigin.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

// ========== OriginImages ==========
router.post("/origins/:originId/images", async (req, res) => {
  const { imageUrl } = req.body;
  const image = await prisma.publicOriginImage.create({
    data: { imageUrl, pageOriginId: Number(req.params.originId) },
  });
  res.json(image);
});

router.delete("/images/:id", async (req, res) => {
  await prisma.publicOriginImage.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

export default router;
