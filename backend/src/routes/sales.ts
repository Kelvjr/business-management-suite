import { Router } from "express";
import { ZodError } from "zod";
import { createSale, deleteSale, getDashboard, getSale, listSales, updateSale } from "../services/sales.service.js";
import { saleInputSchema, saleUpdateSchema } from "../validators/sale.js";

export const salesRouter = Router();

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

salesRouter.get("/", async (req, res, next) => {
  try {
    const sales = await listSales({
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      from: typeof req.query.from === "string" ? new Date(req.query.from) : undefined,
      to: typeof req.query.to === "string" ? new Date(req.query.to) : undefined,
    });
    res.json({ data: sales });
  } catch (error) { next(error); }
});

salesRouter.get("/export.csv", async (req, res, next) => {
  try {
    const sales = await listSales({ search: typeof req.query.search === "string" ? req.query.search : undefined });
    const rows = sales.map((sale) => [sale.reference, sale.soldAt.toISOString(), sale.customerName, sale.description, sale.category, sale.paymentMethod, sale.amount].map(csvCell).join(","));
    const csv = ["Reference,Date,Customer,Description,Category,Payment method,Amount", ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sales.csv");
    res.send(csv);
  } catch (error) { next(error); }
});

salesRouter.get("/:id", async (req, res, next) => {
  try { res.json({ data: await getSale(req.params.id) }); }
  catch (error) { next(error); }
});

salesRouter.post("/", async (req, res, next) => {
  try { res.status(201).json({ data: await createSale(saleInputSchema.parse(req.body)) }); }
  catch (error) { next(error); }
});

salesRouter.patch("/:id", async (req, res, next) => {
  try { res.json({ data: await updateSale(req.params.id, saleUpdateSchema.parse(req.body)) }); }
  catch (error) { next(error); }
});

salesRouter.delete("/:id", async (req, res, next) => {
  try { await deleteSale(req.params.id); res.status(204).send(); }
  catch (error) { next(error); }
});

salesRouter.use((error: unknown, _req: unknown, res: import("express").Response, _next: unknown) => {
  if (error instanceof ZodError) return res.status(400).json({ error: "Invalid sale data", details: error.issues });
  throw error;
});

export const dashboardRouter = Router();
dashboardRouter.get("/", async (_req, res, next) => {
  try { res.json({ data: await getDashboard() }); }
  catch (error) { next(error); }
});
