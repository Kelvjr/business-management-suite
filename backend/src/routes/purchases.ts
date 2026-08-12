import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const purchasesRouter = Router();
const number = (value: Prisma.Decimal) => Number(value);
const createInput = z.object({ supplierId: z.string(), catalogItemId: z.string(), quantity: z.coerce.number().positive(), unitCost: z.coerce.number().positive(), status: z.enum(["DRAFT", "ORDERED", "RECEIVED"]), amountPaid: z.coerce.number().nonnegative().default(0), dueAt: z.coerce.date().optional().nullable(), notes: z.string().optional().nullable() });
const updateInput = z.object({ status: z.enum(["DRAFT", "ORDERED", "RECEIVED"]).optional(), amountPaid: z.coerce.number().nonnegative().optional(), dueAt: z.coerce.date().optional().nullable(), notes: z.string().optional().nullable() });

purchasesRouter.get("/", async (_req, res, next) => { try {
  const rows = await prisma.purchase.findMany({ orderBy: { orderedAt: "desc" }, include: { supplier: true, items: { include: { catalogItem: true } }, payments: { orderBy: { paidAt: "desc" } } } });
  res.json({ data: rows.map((row) => ({ ...row, total: number(row.total), amountPaid: number(row.amountPaid), payments: row.payments.map((payment) => ({ ...payment, amount: number(payment.amount) })), items: row.items.map((item) => ({ ...item, quantity: number(item.quantity), receivedQty: number(item.receivedQty), unitCost: number(item.unitCost) })) })) });
} catch (error) { next(error); } });

purchasesRouter.post("/", async (req, res, next) => { try {
  const input = createInput.parse(req.body);
  const reference = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const result = await prisma.$transaction(async (tx) => {
    const total = input.quantity * input.unitCost;
    if (input.amountPaid > total) throw new Error("Payment exceeds the purchase balance");
    const purchase = await tx.purchase.create({ data: { reference, supplierId: input.supplierId, status: input.status, total, amountPaid: input.amountPaid, dueAt: input.dueAt, receivedAt: input.status === "RECEIVED" ? new Date() : null, notes: input.notes, items: { create: { catalogItemId: input.catalogItemId, quantity: input.quantity, unitCost: input.unitCost, receivedQty: input.status === "RECEIVED" ? input.quantity : 0 } } } });
    if (input.amountPaid > 0) await tx.payment.create({ data: { amount: input.amountPaid, method: "OTHER", direction: "OUT", purchaseId: purchase.id, supplierId: input.supplierId, reference, notes: "Opening purchase payment" } });
    if (input.status === "RECEIVED") {
      const item = await tx.catalogItem.findUniqueOrThrow({ where: { id: input.catalogItemId } });
      const beforeQty = Number(item.quantity); const afterQty = beforeQty + input.quantity;
      await tx.catalogItem.update({ where: { id: item.id }, data: { quantity: afterQty } });
      await tx.inventoryMovement.create({ data: { catalogItemId: item.id, type: "STOCK_IN", quantity: input.quantity, beforeQty, afterQty, reference, notes: "Received from purchase order" } });
    }
    return purchase;
  });
  res.status(201).json({ data: result });
} catch (error) { next(error); } });

purchasesRouter.patch("/:id", async (req, res, next) => { try {
  const input = updateInput.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.purchase.findUniqueOrThrow({ where: { id: req.params.id }, include: { items: true } });
    if (current.status === "RECEIVED" && input.status && input.status !== "RECEIVED") throw new Error("Received purchase orders cannot be reopened");
    if (input.amountPaid !== undefined) {
      const currentPaid = Number(current.amountPaid);
      if (input.amountPaid < currentPaid) throw new Error("Recorded payments cannot be reduced");
      if (input.amountPaid > Number(current.total)) throw new Error("Payment exceeds the purchase balance");
      if (input.amountPaid > currentPaid) await tx.payment.create({ data: { amount: input.amountPaid - currentPaid, method: "OTHER", direction: "OUT", purchaseId: current.id, supplierId: current.supplierId, reference: current.reference, notes: "Purchase payment" } });
    }
    if (input.status === "RECEIVED" && current.status !== "RECEIVED") for (const line of current.items) {
      const item = await tx.catalogItem.findUniqueOrThrow({ where: { id: line.catalogItemId } });
      const beforeQty = Number(item.quantity); const received = Number(line.quantity) - Number(line.receivedQty); const afterQty = beforeQty + received;
      await tx.catalogItem.update({ where: { id: item.id }, data: { quantity: afterQty } });
      await tx.purchaseItem.update({ where: { id: line.id }, data: { receivedQty: line.quantity } });
      await tx.inventoryMovement.create({ data: { catalogItemId: item.id, type: "STOCK_IN", quantity: received, beforeQty, afterQty, reference: current.reference, notes: "Purchase order received" } });
    }
    return tx.purchase.update({ where: { id: current.id }, data: { ...input, receivedAt: input.status === "RECEIVED" ? new Date() : current.receivedAt } });
  });
  res.json({ data: result });
} catch (error) { next(error); } });

purchasesRouter.delete("/:id", async (req, res, next) => { try { const row = await prisma.purchase.findUniqueOrThrow({ where: { id: req.params.id }, include: { _count: { select: { payments: true } } } }); if (row.status === "RECEIVED") return res.status(409).json({ error: "Received purchase orders cannot be deleted" }); if (row._count.payments) return res.status(409).json({ error: "Purchase orders with payments cannot be deleted" }); await prisma.purchase.delete({ where: { id: req.params.id } }); res.status(204).send(); } catch (error) { next(error); } });
