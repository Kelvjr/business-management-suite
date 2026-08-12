import { CatalogKind, Prisma, StockMovementType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { stockAfterMovement } from "../domain/inventory.js";

export const inventoryRouter = Router();
const number = (value: Prisma.Decimal) => Number(value);

inventoryRouter.get("/", async (_req, res, next) => { try {
  const [items, movements] = await Promise.all([
    prisma.catalogItem.findMany({ where: { kind: CatalogKind.PRODUCT }, orderBy: { name: "asc" } }),
    prisma.inventoryMovement.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { catalogItem: { select: { name: true, sku: true } } } }),
  ]);
  res.json({ data: { items: items.map((row) => ({ ...row, costPrice: number(row.costPrice), sellingPrice: number(row.sellingPrice), quantity: number(row.quantity), reorderLevel: number(row.reorderLevel) })), movements: movements.map((row) => ({ ...row, quantity: number(row.quantity), beforeQty: number(row.beforeQty), afterQty: number(row.afterQty) })) } });
} catch (error) { next(error); } });

inventoryRouter.post("/movements", async (req, res, next) => { try {
  const input = z.object({ catalogItemId: z.string(), type: z.nativeEnum(StockMovementType), quantity: z.coerce.number(), reference: z.string().optional().nullable(), notes: z.string().optional().nullable() }).parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.catalogItem.findUniqueOrThrow({ where: { id: input.catalogItemId } });
    const beforeQty = Number(item.quantity);
    const quantity = Math.abs(input.quantity);
    const afterQty = stockAfterMovement(beforeQty, input.type, quantity);
    await tx.catalogItem.update({ where: { id: item.id }, data: { quantity: afterQty } });
    return tx.inventoryMovement.create({ data: { ...input, quantity, beforeQty, afterQty } });
  });
  res.status(201).json({ data: result });
} catch (error) { next(error); } });
