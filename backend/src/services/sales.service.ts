import { DiscountType, PaymentStatus, Prisma, PricingMethod, SaleType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import type { SaleInput, SaleUpdateInput } from "../validators/sale.js";

const saleInclude = {
  items: { orderBy: { sortOrder: "asc" as const } },
  customer: true,
  attachments: true,
  activity: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.SaleInclude;

type SaleWithRelations = Prisma.SaleGetPayload<{ include: typeof saleInclude }>;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const serialize = (sale: SaleWithRelations) => ({
  ...sale,
  amount: Number(sale.amount), measurement: sale.measurement === null ? null : Number(sale.measurement), rate: sale.rate === null ? null : Number(sale.rate),
  subtotal: Number(sale.subtotal), discountValue: Number(sale.discountValue), discountAmount: Number(sale.discountAmount),
  taxRate: Number(sale.taxRate), taxAmount: Number(sale.taxAmount), amountPaid: Number(sale.amountPaid), balanceDue: Number(sale.balanceDue),
  items: sale.items.map((item) => ({ ...item, measurement: item.measurement === null ? null : Number(item.measurement), rate: Number(item.rate), lineTotal: Number(item.lineTotal) })),
});

function calculate(input: Pick<SaleInput, "amount" | "items" | "discountType" | "discountValue" | "taxRate" | "manualTotalOverride" | "paymentStatus" | "amountPaid">) {
  const subtotal = input.items?.reduce((sum, item) => sum + item.lineTotal, 0) ?? input.amount;
  const discountAmount = input.discountType === "PERCENTAGE" ? subtotal * (input.discountValue / 100) : input.discountType === "FIXED" ? Math.min(input.discountValue, subtotal) : 0;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * (input.taxRate / 100);
  const calculatedTotal = taxable + taxAmount;
  const amount = input.manualTotalOverride ? input.amount : calculatedTotal;
  const amountPaid = input.paymentStatus === "PAID" ? amount : input.paymentStatus === "UNPAID" ? 0 : Math.min(input.amountPaid ?? 0, amount);
  return { subtotal, discountAmount, taxAmount, amount, amountPaid, balanceDue: Math.max(0, amount - amountPaid) };
}

function itemData(items: NonNullable<SaleInput["items"]>) {
  return items.map((item, index) => ({ ...item, measurement: item.measurement ?? null, unit: item.unit || null, sortOrder: index }));
}

export async function listSales(params: { search?: string; from?: Date; to?: Date }) {
  const where: Prisma.SaleWhereInput = {};
  if (params.search) where.OR = [
    { reference: { contains: params.search, mode: "insensitive" } }, { customerName: { contains: params.search, mode: "insensitive" } },
    { description: { contains: params.search, mode: "insensitive" } }, { category: { contains: params.search, mode: "insensitive" } },
    { items: { some: { name: { contains: params.search, mode: "insensitive" } } } },
  ];
  if (params.from || params.to) where.soldAt = { gte: params.from, lte: params.to };
  return (await prisma.sale.findMany({ where, orderBy: { soldAt: "desc" }, include: saleInclude })).map(serialize);
}

export async function getSale(id: string) {
  return serialize(await prisma.sale.findUniqueOrThrow({ where: { id }, include: saleInclude }));
}

export async function createSale(input: SaleInput) {
  const reference = input.reference || `SAL-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const items = input.items ?? [{ name: input.description, type: input.type, pricingMethod: input.pricingMethod, measurement: input.measurement, unit: input.unit, rate: input.rate ?? input.amount, lineTotal: input.amount, manualTotalOverride: input.manualTotalOverride }];
  const totals = calculate({ ...input, items });
  const customerRelation = input.customer?.id ? { connect: { id: input.customer.id } } : input.customer ? { create: { name: input.customer.name, phone: input.customer.phone || null, email: input.customer.email || null } } : undefined;
  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({ data: {
      reference, customerName: input.customer?.name ?? input.customerName ?? null, description: input.description, category: input.category,
      amount: totals.amount, paymentMethod: input.paymentMethod, type: input.type, pricingMethod: input.pricingMethod,
      measurement: input.measurement ?? null, unit: input.unit || null, rate: input.rate ?? null, subtotal: totals.subtotal,
      discountType: input.discountType, discountValue: input.discountValue, discountAmount: totals.discountAmount,
      taxRate: input.taxRate, taxAmount: totals.taxAmount, manualTotalOverride: input.manualTotalOverride,
      paymentStatus: input.paymentStatus, amountPaid: totals.amountPaid, balanceDue: totals.balanceDue,
      soldAt: input.soldAt, notes: input.notes || null, customFields: input.customFields,
      customer: customerRelation, items: { create: itemData(items) },
      attachments: input.attachments.length ? { create: input.attachments } : undefined,
      activity: { create: { action: "CREATED", summary: `Sale recorded for ${totals.amount.toFixed(2)}` } },
    }, include: saleInclude });
    for (const item of items) {
      if (!item.catalogItemId) continue;
      const catalog = await tx.catalogItem.findUnique({ where: { id: item.catalogItemId } });
      if (!catalog || catalog.kind !== "PRODUCT") continue;
      const quantity = item.measurement ?? 1;
      const beforeQty = Number(catalog.quantity);
      const afterQty = beforeQty - quantity;
      if (afterQty < 0) throw new Error(`Insufficient stock for ${catalog.name}`);
      await tx.catalogItem.update({ where: { id: catalog.id }, data: { quantity: afterQty } });
      await tx.inventoryMovement.create({ data: { catalogItemId: catalog.id, type: "STOCK_OUT", quantity, beforeQty, afterQty, reference, notes: "Automatically deducted from sale" } });
    }
    return created;
  });
  return serialize(sale);
}

export async function updateSale(id: string, input: SaleUpdateInput) {
  const current = await prisma.sale.findUniqueOrThrow({ where: { id }, include: { items: true } });
  const items = input.items ?? current.items.map((item) => ({ name: item.name, type: item.type, pricingMethod: item.pricingMethod, measurement: item.measurement === null ? null : Number(item.measurement), unit: item.unit, rate: Number(item.rate), lineTotal: Number(item.lineTotal), manualTotalOverride: item.manualTotalOverride }));
  const merged = {
    amount: input.amount ?? Number(current.amount), items,
    discountType: input.discountType ?? current.discountType, discountValue: input.discountValue ?? Number(current.discountValue),
    taxRate: input.taxRate ?? Number(current.taxRate), manualTotalOverride: input.manualTotalOverride ?? (input.amount !== undefined ? true : current.manualTotalOverride),
    paymentStatus: input.paymentStatus ?? current.paymentStatus, amountPaid: input.amountPaid ?? Number(current.amountPaid),
  };
  const totals = calculate(merged);
  const customerRelation = input.customer?.id ? { connect: { id: input.customer.id } } : input.customer ? { create: { name: input.customer.name, phone: input.customer.phone || null, email: input.customer.email || null } } : undefined;
  const sale = await prisma.sale.update({ where: { id }, data: {
    ...(input.reference !== undefined ? { reference: input.reference || current.reference } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}), ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}), ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.pricingMethod !== undefined ? { pricingMethod: input.pricingMethod } : {}), ...(input.soldAt !== undefined ? { soldAt: input.soldAt } : {}),
    ...(input.notes !== undefined ? { notes: input.notes || null } : {}), ...(input.customFields !== undefined ? { customFields: input.customFields } : {}),
    customerName: input.customer?.name ?? input.customerName ?? current.customerName, ...(customerRelation ? { customer: customerRelation } : {}),
    amount: totals.amount, subtotal: totals.subtotal, discountType: merged.discountType, discountValue: merged.discountValue,
    discountAmount: totals.discountAmount, taxRate: merged.taxRate, taxAmount: totals.taxAmount, manualTotalOverride: merged.manualTotalOverride,
    paymentStatus: merged.paymentStatus, amountPaid: totals.amountPaid, balanceDue: totals.balanceDue,
    ...(input.items ? { items: { deleteMany: {}, create: itemData(input.items) } } : {}),
    activity: { create: { action: "UPDATED", summary: "Sale details updated", changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue } },
  }, include: saleInclude });
  return serialize(sale);
}

export async function deleteSale(id: string) {
  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({ where: { id }, include: { items: true } });
    for (const item of sale.items) {
      if (!item.catalogItemId) continue;
      const catalog = await tx.catalogItem.findUnique({ where: { id: item.catalogItemId } });
      if (!catalog || catalog.kind !== "PRODUCT") continue;
      const quantity = item.measurement === null ? 1 : Number(item.measurement); const beforeQty = Number(catalog.quantity); const afterQty = beforeQty + quantity;
      await tx.catalogItem.update({ where: { id: catalog.id }, data: { quantity: afterQty } });
      await tx.inventoryMovement.create({ data: { catalogItemId: catalog.id, type: "STOCK_IN", quantity, beforeQty, afterQty, reference: sale.reference, notes: "Stock restored after sale deletion" } });
    }
    await tx.sale.delete({ where: { id } });
  });
}

export async function getDashboard() {
  const now = new Date(); const today = startOfDay(now); const week = new Date(today); week.setDate(today.getDate() - 6);
  const month = new Date(now.getFullYear(), now.getMonth(), 1); const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); const priorMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const [todayAgg, weekAgg, monthAgg, priorMonthAgg, recent, monthSales] = await Promise.all([
    prisma.sale.aggregate({ where: { soldAt: { gte: today } }, _sum: { amount: true }, _count: true }), prisma.sale.aggregate({ where: { soldAt: { gte: week } }, _sum: { amount: true }, _count: true }),
    prisma.sale.aggregate({ where: { soldAt: { gte: month } }, _sum: { amount: true }, _count: true }), prisma.sale.aggregate({ where: { soldAt: { gte: priorMonthStart, lte: priorMonthEnd } }, _sum: { amount: true } }),
    prisma.sale.findMany({ orderBy: { soldAt: "desc" }, take: 8, include: saleInclude }), prisma.sale.findMany({ where: { soldAt: { gte: month } }, orderBy: { soldAt: "asc" }, include: saleInclude }),
  ]);
  const revenueByDay = Array.from({ length: 7 }, (_, index) => { const date = new Date(today); date.setDate(today.getDate() - (6 - index)); return { date: date.toISOString(), revenue: monthSales.filter((sale) => sale.soldAt.toDateString() === date.toDateString()).reduce((sum, sale) => sum + Number(sale.amount), 0) }; });
  const categoryMap = new Map<string, number>(); monthSales.forEach((sale) => categoryMap.set(sale.category, (categoryMap.get(sale.category) ?? 0) + Number(sale.amount)));
  const categories = [...categoryMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  const monthRevenue = Number(monthAgg._sum.amount ?? 0); const priorRevenue = Number(priorMonthAgg._sum.amount ?? 0);
  return { metrics: { today: { revenue: Number(todayAgg._sum.amount ?? 0), transactions: todayAgg._count }, week: { revenue: Number(weekAgg._sum.amount ?? 0), transactions: weekAgg._count }, month: { revenue: monthRevenue, transactions: monthAgg._count, growth: priorRevenue === 0 ? 100 : ((monthRevenue - priorRevenue) / priorRevenue) * 100 } }, revenueByDay, categories, recent: recent.map(serialize) };
}
