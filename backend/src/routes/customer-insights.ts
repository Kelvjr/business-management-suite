import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const customerInsightsRouter = Router();

customerInsightsRouter.get("/", async (_req, res, next) => { try {
  const rows = await prisma.customer.findMany({ orderBy: { name: "asc" }, include: { sales: { orderBy: { soldAt: "desc" }, include: { items: true } }, invoices: { orderBy: { issuedAt: "desc" } }, payments: { orderBy: { paidAt: "desc" } } } });
  res.json({ data: rows.map((row) => {
    const totalSpent = row.sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
    const productCounts = new Map<string, number>();
    row.sales.flatMap((sale) => sale.items).forEach((item) => productCounts.set(item.name, (productCounts.get(item.name) ?? 0) + 1));
    const invoiceOutstanding = row.invoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total) - Number(invoice.amountPaid)), 0);
    return { ...row, totalSpent, lastPurchase: row.sales[0]?.soldAt ?? null, orders: row.sales.length, favoriteProduct: [...productCounts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null, averageOrderValue: row.sales.length ? totalSpent / row.sales.length : 0, invoiceTotal: row.invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0), outstandingBalance: invoiceOutstanding, paymentTotal: row.payments.filter((payment) => payment.direction === "IN").reduce((sum, payment) => sum + Number(payment.amount), 0) };
  }) });
} catch (error) { next(error); } });
