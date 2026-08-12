import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const customersRouter = Router();
const input = z.object({ name: z.string().trim().min(1).max(120), phone: z.string().trim().max(40).optional().nullable(), email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")), address: z.string().trim().max(240).optional().nullable(), birthday: z.coerce.date().optional().nullable(), notes: z.string().trim().max(2000).optional().nullable() });

customersRouter.get("/", async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const customers = await prisma.customer.findMany({ where: search ? { name: { contains: search, mode: "insensitive" } } : undefined, orderBy: { name: "asc" }, take: 100, include: { _count: { select: { sales: true } } } });
    res.json({ data: customers });
  } catch (error) { next(error); }
});

customersRouter.post("/", async (req, res, next) => {
  try { res.status(201).json({ data: await prisma.customer.create({ data: input.parse(req.body) }) }); }
  catch (error) { next(error); }
});

customersRouter.patch("/:id", async (req, res, next) => {
  try { res.json({ data: await prisma.customer.update({ where: { id: req.params.id }, data: input.partial().parse(req.body) }) }); }
  catch (error) { next(error); }
});

customersRouter.delete("/:id", async (req, res, next) => {
  try { const customer = await prisma.customer.findUniqueOrThrow({ where: { id: req.params.id }, include: { _count: { select: { sales: true, invoices: true, payments: true } } } }); if (customer._count.sales || customer._count.invoices || customer._count.payments) return res.status(409).json({ error: "Customers with sales, invoices, or payment history cannot be deleted" }); await prisma.customer.delete({ where: { id: req.params.id } }); res.status(204).send(); }
  catch (error) { next(error); }
});
