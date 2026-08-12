import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const suppliersRouter = Router();
const number = (value: Prisma.Decimal) => Number(value);
const input = z.object({ name: z.string().trim().min(1).max(160), contactName: z.string().trim().max(120).optional().nullable(), phone: z.string().trim().max(40).optional().nullable(), email: z.string().trim().email().optional().nullable().or(z.literal("")), address: z.string().trim().max(240).optional().nullable(), paymentTerms: z.string().trim().max(120).optional().nullable() });

suppliersRouter.get("/", async (_req, res, next) => { try {
  const rows = await prisma.supplier.findMany({ orderBy: { name: "asc" }, include: { products: { include: { catalogItem: true } }, purchases: { orderBy: { orderedAt: "desc" } } } });
  res.json({ data: rows.map((row) => ({ ...row, outstandingBalance: row.purchases.reduce((sum, purchase) => sum + Math.max(0, number(purchase.total) - number(purchase.amountPaid)), 0), purchases: row.purchases.map((purchase) => ({ ...purchase, total: number(purchase.total), amountPaid: number(purchase.amountPaid) })) })) });
} catch (error) { next(error); } });
suppliersRouter.post("/", async (req, res, next) => { try { const row = await prisma.supplier.create({ data: input.parse(req.body) }); res.status(201).json({ data: { ...row, outstandingBalance: 0, products: [], purchases: [] } }); } catch (error) { next(error); } });
suppliersRouter.patch("/:id", async (req, res, next) => { try { await prisma.supplier.update({ where: { id: req.params.id }, data: input.partial().parse(req.body) }); const row = await prisma.supplier.findUniqueOrThrow({ where: { id: req.params.id }, include: { products: { include: { catalogItem: true } }, purchases: { orderBy: { orderedAt: "desc" } } } }); res.json({ data: { ...row, outstandingBalance: row.purchases.reduce((sum, purchase) => sum + Math.max(0, number(purchase.total) - number(purchase.amountPaid)), 0), purchases: row.purchases.map((purchase) => ({ ...purchase, total: number(purchase.total), amountPaid: number(purchase.amountPaid) })) } }); } catch (error) { next(error); } });
suppliersRouter.delete("/:id", async (req, res, next) => { try { const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: req.params.id }, include: { _count: { select: { purchases: true, payments: true } } } }); if (supplier._count.purchases || supplier._count.payments) return res.status(409).json({ error: "Suppliers with purchase or payment history cannot be deleted" }); await prisma.supplier.delete({ where: { id: req.params.id } }); res.status(204).send(); } catch (error) { next(error); } });
