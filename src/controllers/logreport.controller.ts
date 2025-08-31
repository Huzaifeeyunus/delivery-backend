import { Request, Response } from "express";
import prisma from "../lib/prisma";

// ✅ Create
export const createLogReport = async (req: Request, res: Response) => {
  try {
    const { title, message, level } = req.body;
    const log = await prisma.logReport.create({
      data: { title, message, level },
    });
    res.status(201).json(log);
  } catch (err) {
    console.error("Error creating log report:", err);
    res.status(500).json({ message: "Failed to create log report." });
  }
};

// ✅ Read all
export const getAllLogReports = async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.logReport.findMany({ orderBy: { createdAt: "desc" } });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch log reports." });
  }
};

// ✅ Read one
export const getLogReport = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const log = await prisma.logReport.findUnique({ where: { id } });
    if (!log) return res.status(404).json({ message: "Log report not found." });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch log report." });
  }
};

// ✅ Update
export const updateLogReport = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, message, level } = req.body;
    const log = await prisma.logReport.update({
      where: { id },
      data: { title, message, level },
    });
    res.json(log);
  } catch (err) {
    console.error("Error updating log report:", err);
    res.status(500).json({ message: "Failed to update log report." });
  }
};

// ✅ Delete
export const deleteLogReport = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.logReport.delete({ where: { id } });
    res.json({ message: "Log report deleted." });
  } catch (err) {
    console.error("Error deleting log report:", err);
    res.status(500).json({ message: "Failed to delete log report." });
  }
};
