import { PaymentDirection, PaymentMethod, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { invoicePaymentStatus, paymentIncrease } from "../domain/payments.js";

export const paymentsRouter = Router();

const paymentInput = z.object({
  amount: z.coerce.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  direction: z.nativeEnum(PaymentDirection),
  paidAt: z.coerce.date().optional(),
  reference: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  customerId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  purchaseId: z.string().optional().nullable(),
}).superRefine((value, context) => {
  const links = [value.invoiceId, value.saleId, value.purchaseId].filter(Boolean);
  if (links.length > 1) context.addIssue({ code: "custom", message: "A payment can settle only one document at a time" });
  if (value.direction === PaymentDirection.IN && value.purchaseId) context.addIssue({ code: "custom", message: "Purchase payments must be outgoing" });
  if (value.direction === PaymentDirection.OUT && (value.invoiceId || value.saleId)) context.addIssue({ code: "custom", message: "Invoice and sale payments must be incoming" });
  if (value.customerId && value.supplierId) context.addIssue({ code: "custom", message: "A payment cannot belong to both a customer and a supplier" });
});

const serialize = <T extends { amount: Prisma.Decimal }>(payment: T) => ({
  ...payment,
  amount: Number(payment.amount),
});

paymentsRouter.get("/", async (req, res, next) => {
  try {
    const direction = z.nativeEnum(PaymentDirection).optional().parse(req.query.direction);
    const rows = await prisma.payment.findMany({
      where: direction ? { direction } : undefined,
      orderBy: { paidAt: "desc" },
      take: 200,
      include: {
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        invoice: { select: { id: true, reference: true } },
        sale: { select: { id: true, reference: true } },
        purchase: { select: { id: true, reference: true } },
      },
    });
    res.json({ data: rows.map(serialize) });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post("/", async (req, res, next) => {
  try {
    const input = paymentInput.parse(req.body);
    const payment = await prisma.$transaction(async (tx) => {
      const paymentData = { ...input };
      if (input.invoiceId) {
        const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: input.invoiceId } });
        const alreadyPaid = await tx.payment.aggregate({ where: { invoiceId: invoice.id }, _sum: { amount: true } });
        const currentPaid = Math.max(Number(invoice.amountPaid), Number(alreadyPaid._sum.amount ?? 0));
        const paidTotal = currentPaid + paymentIncrease(currentPaid, currentPaid + input.amount, Number(invoice.total));
        const status = invoicePaymentStatus(paidTotal, Number(invoice.total));
        await tx.invoice.update({ where: { id: invoice.id }, data: { amountPaid: paidTotal, status } });
        paymentData.customerId = invoice.customerId;
        paymentData.reference ??= invoice.reference;
      }

      if (input.purchaseId) {
        const purchase = await tx.purchase.findUniqueOrThrow({ where: { id: input.purchaseId } });
        const alreadyPaid = await tx.payment.aggregate({ where: { purchaseId: purchase.id }, _sum: { amount: true } });
        const currentPaid = Math.max(Number(purchase.amountPaid), Number(alreadyPaid._sum.amount ?? 0));
        const paidTotal = currentPaid + paymentIncrease(currentPaid, currentPaid + input.amount, Number(purchase.total));
        await tx.purchase.update({ where: { id: purchase.id }, data: { amountPaid: paidTotal } });
        paymentData.supplierId = purchase.supplierId;
        paymentData.reference ??= purchase.reference;
      }

      if (input.saleId) {
        const sale = await tx.sale.findUniqueOrThrow({ where: { id: input.saleId } });
        const alreadyPaid = await tx.payment.aggregate({ where: { saleId: sale.id }, _sum: { amount: true } });
        const currentPaid = Math.max(Number(sale.amountPaid), Number(alreadyPaid._sum.amount ?? 0));
        const paidTotal = currentPaid + paymentIncrease(currentPaid, currentPaid + input.amount, Number(sale.amount));
        const status = invoicePaymentStatus(paidTotal, Number(sale.amount));
        await tx.sale.update({ where: { id: sale.id }, data: { amountPaid: paidTotal, balanceDue: Number(sale.amount) - paidTotal, paymentStatus: status } });
        paymentData.customerId = sale.customerId;
        paymentData.reference ??= sale.reference;
      }

      return tx.payment.create({ data: paymentData });
    });
    res.status(201).json({ data: serialize(payment) });
  } catch (error) {
    next(error);
  }
});
