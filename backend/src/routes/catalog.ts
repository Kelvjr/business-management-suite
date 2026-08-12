import { CatalogKind, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { productImageDto } from "../storage/dto.js";

export const catalogRouter = Router();
const number = (value: Prisma.Decimal | null | undefined) => value == null ? null : Number(value);
const input = z.object({
  kind: z.nativeEnum(CatalogKind), name: z.string().trim().min(1).max(160),
  sku: z.string().trim().max(80).optional().nullable(), category: z.string().trim().min(1).max(80),
  costPrice: z.coerce.number().nonnegative().default(0), sellingPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().nonnegative().default(0), reorderLevel: z.coerce.number().nonnegative().default(0),
  barcode: z.string().trim().max(120).optional().nullable(),
  durationMinutes: z.coerce.number().int().positive().optional().nullable(), assignedStaff: z.string().trim().max(120).optional().nullable(),
  active: z.boolean().optional(),
});
const serialize = <T extends { id: string; costPrice: Prisma.Decimal; sellingPrice: Prisma.Decimal; quantity: Prisma.Decimal; reorderLevel: Prisma.Decimal; images?: Array<{ id: string; originalName: string; mimeType: string; size: number; storageKey: string; isPrimary: boolean }> }>(row: T) => ({ ...row, costPrice: number(row.costPrice), sellingPrice: number(row.sellingPrice), quantity: number(row.quantity), reorderLevel: number(row.reorderLevel), images: row.images?.map((image) => productImageDto(row.id, image)) ?? [] });

catalogRouter.get("/", async (_req, res, next) => { try { const rows = await prisma.catalogItem.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }], include: { images: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }, _count: { select: { saleItems: true } } } }); res.json({ data: rows.map(serialize) }); } catch (error) { next(error); } });
catalogRouter.post("/", async (req, res, next) => { try { const data = input.parse(req.body); const created = await prisma.$transaction(async (tx) => { const item = await tx.catalogItem.create({ data }); if (item.kind === "PRODUCT" && Number(item.quantity) > 0) await tx.inventoryMovement.create({ data: { catalogItemId: item.id, type: "STOCK_IN", quantity: item.quantity, beforeQty: 0, afterQty: item.quantity, reference: "OPENING", notes: "Opening stock" } }); return item; }); res.status(201).json({ data: serialize(created) }); } catch (error) { next(error); } });
catalogRouter.patch("/:id", async (req, res, next) => { try { const data = input.partial().parse(req.body); const updated = await prisma.$transaction(async (tx) => { const current = await tx.catalogItem.findUniqueOrThrow({ where: { id: req.params.id } }); const item = await tx.catalogItem.update({ where: { id: req.params.id }, data }); if (data.quantity !== undefined && data.quantity !== Number(current.quantity)) await tx.inventoryMovement.create({ data: { catalogItemId: item.id, type: "ADJUSTMENT", quantity: Math.abs(data.quantity - Number(current.quantity)), beforeQty: current.quantity, afterQty: data.quantity, reference: "CATALOG-EDIT", notes: "Stock changed while editing catalog item" } }); return item; }); res.json({ data: serialize(updated) }); } catch (error) { next(error); } });
catalogRouter.delete("/:id", async (req, res, next) => { try { const item = await prisma.catalogItem.findUniqueOrThrow({ where: { id: req.params.id }, include: { _count: { select: { saleItems: true, purchaseItems: true, movements: true, images: true } } } }); if (item._count.saleItems || item._count.purchaseItems || item._count.movements) return res.status(409).json({ error: "Catalog items with transaction history cannot be deleted; mark the item inactive instead" }); if (item._count.images) return res.status(409).json({ error: "Remove the product images before deleting this item" }); await prisma.catalogItem.delete({ where: { id: req.params.id } }); res.status(204).send(); } catch (error) { next(error); } });
