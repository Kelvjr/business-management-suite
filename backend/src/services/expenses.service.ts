import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import type { ExpenseInput, ExpenseUpdateInput } from "../validators/expense.js";

const include = { attachments: true, activity: { orderBy: { createdAt: "desc" as const } } } satisfies Prisma.ExpenseInclude;
type ExpenseRow = Prisma.ExpenseGetPayload<{ include: typeof include }>;
const serialize = (row: ExpenseRow) => ({ ...row, amount: Number(row.amount), amountPaid: Number(row.amountPaid), balanceDue: Number(row.balanceDue) });
const payments = (amount: number, status: ExpenseInput["paymentStatus"], paid: number) => {
  const amountPaid = status === "PAID" ? amount : status === "UNPAID" ? 0 : Math.min(paid, amount);
  return { amountPaid, balanceDue: Math.max(0, amount - amountPaid) };
};

export async function listExpenses(params: { search?: string; from?: Date; to?: Date }) {
  const where: Prisma.ExpenseWhereInput = {};
  if (params.search) where.OR = [{ reference: { contains: params.search, mode: "insensitive" } }, { vendor: { contains: params.search, mode: "insensitive" } }, { description: { contains: params.search, mode: "insensitive" } }, { category: { contains: params.search, mode: "insensitive" } }];
  if (params.from || params.to) where.incurredAt = { gte: params.from, lte: params.to };
  return (await prisma.expense.findMany({ where, orderBy: { incurredAt: "desc" }, include })).map(serialize);
}

export async function getExpense(id: string) { return serialize(await prisma.expense.findUniqueOrThrow({ where: { id }, include })); }

export async function createExpense(input: ExpenseInput) {
  const reference = input.reference || `EXP-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const paid = payments(input.amount, input.paymentStatus, input.amountPaid);
  return serialize(await prisma.expense.create({ data: { reference, vendor: input.vendor || null, description: input.description, category: input.category, amount: input.amount, paymentMethod: input.paymentMethod, paymentStatus: input.paymentStatus, ...paid, incurredAt: input.incurredAt, notes: input.notes || null, customFields: input.customFields, isRecurring: input.isRecurring, recurrence: input.isRecurring ? input.recurrence : null, nextDueAt: input.isRecurring ? input.nextDueAt : null, attachments: input.attachments.length ? { create: input.attachments } : undefined, activity: { create: { action: "CREATED", summary: `Expense recorded for ${input.amount.toFixed(2)}` } } }, include }));
}

export async function updateExpense(id: string, input: ExpenseUpdateInput) {
  const current = await prisma.expense.findUniqueOrThrow({ where: { id } });
  const amount = input.amount ?? Number(current.amount); const status = input.paymentStatus ?? current.paymentStatus;
  const paid = payments(amount, status, input.amountPaid ?? Number(current.amountPaid));
  return serialize(await prisma.expense.update({ where: { id }, data: { ...input, reference: input.reference || current.reference, vendor: input.vendor === undefined ? current.vendor : input.vendor || null, notes: input.notes === undefined ? current.notes : input.notes || null, amount, ...paid, attachments: undefined, activity: { create: { action: "UPDATED", summary: "Expense details updated", changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue } } }, include }));
}

export async function deleteExpense(id: string) { await prisma.expense.delete({ where: { id } }); }
