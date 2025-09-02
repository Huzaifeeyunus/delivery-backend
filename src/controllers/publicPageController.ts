import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Get all pages
export const getPages = async (req: Request, res: Response) => {
  const pages = await prisma.publicPage.findMany({
    include: { origins: { include: { images: true } } },
  });
  res.json(pages);
};

// Get single page by slug
export const getPageBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const page = await prisma.publicPage.findUnique({
    where: { slug },
    include: { origins: { include: { images: true } } },
  });
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json(page);
};

// Create page
export const createPage = async (req: Request, res: Response) => {
  const { slug, title, description } = req.body;
  const page = await prisma.publicPage.create({
    data: { slug, title, description },
  });
  res.json(page);
};

// Update page
export const updatePage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { slug, title, description } = req.body;
  const page = await prisma.publicPage.update({
    where: { id: Number(id) },
    data: { slug, title, description },
  });
  res.json(page);
};

// Delete page
export const deletePage = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.publicPage.delete({ where: { id: Number(id) } });
  res.json({ message: "Page deleted" });
};
