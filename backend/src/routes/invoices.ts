import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const invoicesRouter = Router();
const number = (value: Prisma.Decimal) => Number(value);
const createInput = z.object({ customerId: z.string().optional().nullable(), customerName: z.string().trim().min(1), description: z.string().trim().min(1), quantity: z.coerce.number().positive(), rate: z.coerce.number().positive(), dueAt: z.coerce.date(), taxRate: z.coerce.number().min(0).max(100).default(0), notes: z.string().optional().nullable() });
const updateInput = z.object({ customerName: z.string().trim().min(1).optional(), status: z.enum(["PAID", "PARTIALLY_PAID", "UNPAID"]).optional(), amountPaid: z.coerce.number().nonnegative().optional(), dueAt: z.coerce.date().optional(), notes: z.string().optional().nullable() });

invoicesRouter.get("/", async (_req, res, next) => { try {
  const rows = await prisma.invoice.findMany({ orderBy: { issuedAt: "desc" }, include: { items: true, payments: { orderBy: { paidAt: "desc" } } } });
  res.json({ data: rows.map((row) => ({ ...row, subtotal: number(row.subtotal), taxAmount: number(row.taxAmount), total: number(row.total), amountPaid: number(row.amountPaid), payments: row.payments.map((payment) => ({ ...payment, amount: number(payment.amount) })), items: row.items.map((item) => ({ ...item, quantity: number(item.quantity), rate: number(item.rate), total: number(item.total) })) })) });
} catch (error) { next(error); } });

invoicesRouter.post("/", async (req, res, next) => { try {
  const input = createInput.parse(req.body); const subtotal = input.quantity * input.rate; const taxAmount = subtotal * input.taxRate / 100; const total = subtotal + taxAmount;
  const invoice = await prisma.invoice.create({ data: { reference: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, customerId: input.customerId, customerName: input.customerName, status: "UNPAID", subtotal, taxAmount, total, amountPaid: 0, dueAt: input.dueAt, notes: input.notes, items: { create: { description: input.description, quantity: input.quantity, rate: input.rate, total: subtotal } } } });
  res.status(201).json({ data: invoice });
} catch (error) { next(error); } });

invoicesRouter.patch("/:id", async (req, res, next) => { try {
  const input = updateInput.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.invoice.findUniqueOrThrow({ where: { id: req.params.id } });
    const targetPaid = input.status === "PAID" ? Number(current.total) : input.status === "UNPAID" ? Number(current.amountPaid) : input.amountPaid ?? Number(current.amountPaid);
    if (targetPaid < Number(current.amountPaid)) throw new Error("Recorded payments cannot be reduced");
    if (targetPaid > Number(current.total)) throw new Error("Payment exceeds the invoice balance");
    if (targetPaid > Number(current.amountPaid)) await tx.payment.create({ data: { amount: targetPaid - Number(current.amountPaid), method: "OTHER", direction: "IN", invoiceId: current.id, customerId: current.customerId, reference: current.reference, notes: "Invoice payment" } });
    const status = targetPaid === Number(current.total) ? "PAID" : targetPaid > 0 ? "PARTIALLY_PAID" : "UNPAID";
    return tx.invoice.update({ where: { id: current.id }, data: { ...input, amountPaid: targetPaid, status } });
  });
  res.json({ data: result });
} catch (error) { next(error); } });

invoicesRouter.delete("/:id", async (req, res, next) => { try { const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: req.params.id }, include: { _count: { select: { payments: true } } } }); if (invoice._count.payments) return res.status(409).json({ error: "Invoices with payments cannot be deleted" }); await prisma.invoice.delete({ where: { id: req.params.id } }); res.status(204).send(); } catch (error) { next(error); } });
