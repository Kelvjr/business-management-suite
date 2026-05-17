import { prisma } from "../../lib/prisma";
import { DEFAULT_BUSINESS_ID } from "../../core/context";
import {
  CreateExpenseSchemaType,
  UpdateExpenseSchemaType,
} from "./expenses.validator";
import { getDateRange } from "../sales/sales.service";

type ExpenseFilters = {
  category?: string;
  recurring?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
};

export async function getAllExpenses(filters?: ExpenseFilters) {
  const where: any = {
    businessId: DEFAULT_BUSINESS_ID,
  };

  if (filters?.category) where.category = filters.category;
  if (filters?.recurring === "true") where.recurring = true;
  if (filters?.recurring === "false") where.recurring = false;
  if (filters?.startDate || filters?.endDate) {
    where.date = getDateRange(filters.startDate, filters.endDate);
  }
  if (filters?.search) {
    where.OR = [
      { vendor: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
      { category: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function getExpenseById(id: string) {
  return prisma.expense.findFirst({
    where: { id, businessId: DEFAULT_BUSINESS_ID },
  });
}

export async function createExpense(data: CreateExpenseSchemaType) {
  return prisma.expense.create({
    data: {
      businessId: DEFAULT_BUSINESS_ID,
      category: data.category,
      amount: data.amount,
      date: data.date ? new Date(data.date) : new Date(),
      vendor: data.vendor || null,
      notes: data.notes || null,
      recurring: data.recurring ?? false,
    },
  });
}

export async function updateExpense(id: string, data: UpdateExpenseSchemaType) {
  return prisma.expense.update({
    where: { id },
    data: {
      ...(data.category !== undefined && { category: data.category }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.date !== undefined && {
        date: data.date ? new Date(data.date) : undefined,
      }),
      ...(data.vendor !== undefined && { vendor: data.vendor || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.recurring !== undefined && { recurring: data.recurring }),
    },
  });
}

export async function deleteExpense(id: string) {
  return prisma.expense.delete({ where: { id } });
}

export async function getExpenseSummary(startDate?: string, endDate?: string) {
  const where = {
    businessId: DEFAULT_BUSINESS_ID,
    ...(startDate || endDate ? { date: getDateRange(startDate, endDate) } : {}),
  };

  const [total, byCategory, recurringTotal] = await Promise.all([
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.expense.aggregate({
      where: { ...where, recurring: true },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    totalExpenses: Number(total._sum.amount ?? 0),
    expenseCount: total._count,
    recurringExpenses: Number(recurringTotal._sum.amount ?? 0),
    recurringCount: recurringTotal._count,
    byCategory: byCategory.map((item) => ({
      category: item.category,
      total: Number(item._sum.amount ?? 0),
      count: item._count,
    })),
  };
}

export async function getExpenseTotals(startDate?: string, endDate?: string) {
  const result = await prisma.expense.aggregate({
    where: {
      businessId: DEFAULT_BUSINESS_ID,
      ...(startDate || endDate ? { date: getDateRange(startDate, endDate) } : {}),
    },
    _sum: { amount: true },
    _count: true,
  });

  return {
    expenses: Number(result._sum.amount ?? 0),
    expenseCount: result._count,
  };
}

