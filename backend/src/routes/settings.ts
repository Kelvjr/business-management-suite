import { Router } from "express";
import { z, ZodError } from "zod";
import { prisma } from "../lib/prisma.js";

const settingsInput = z.object({
  businessName: z.string().trim().min(2).max(120),
  currency: z.enum(["USD", "GBP", "EUR", "NGN", "GHS", "KES", "ZAR"]),
  timezone: z.string().trim().min(2).max(80),
  weekStartsOn: z.number().int().min(0).max(6),
  emailReports: z.boolean(),
  saleNotifications: z.boolean(),
  salesCustomFields: z.array(z.object({ id: z.string(), label: z.string().trim().min(1).max(80), required: z.boolean() })).max(20),
});

export const settingsRouter = Router();

settingsRouter.get("/", async (_req, res, next) => {
  try {
    const settings = await prisma.businessSettings.upsert({ where: { id: "primary" }, update: {}, create: { id: "primary" } });
    res.json({ data: settings });
  } catch (error) { next(error); }
});

settingsRouter.put("/", async (req, res, next) => {
  try {
    const input = settingsInput.parse(req.body);
    const settings = await prisma.businessSettings.upsert({ where: { id: "primary" }, update: input, create: { id: "primary", ...input } });
    res.json({ data: settings });
  } catch (error) { next(error); }
});

settingsRouter.use((error: unknown, _req: unknown, res: import("express").Response, _next: unknown) => {
  if (error instanceof ZodError) return res.status(400).json({ error: "Invalid settings", details: error.issues });
  throw error;
});
