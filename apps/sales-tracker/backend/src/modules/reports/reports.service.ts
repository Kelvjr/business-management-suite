import { prisma } from "../../lib/prisma";
import { DEFAULT_BUSINESS_ID } from "../../core/context";
import { getExpenseSummary } from "../expenses/expenses.service";
import { getProfitSummary, getProfitTrend } from "../profit/profit.service";
import { getDateRange } from "../sales/sales.service";

type ReportFilters = {
  startDate?: string;
  endDate?: string;
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function rowToCsvValue(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function rowsToDelimited(
  rows: Record<string, unknown>[],
  delimiter: "," | "\t" = ",",
) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(delimiter),
    ...rows.map((row) => headers.map((header) => rowToCsvValue(row[header])).join(delimiter)),
  ];
  return lines.join("\n");
}

export async function getBusinessOverview(filters: ReportFilters = {}) {
  const { startDate, endDate } = filters;
  const dateWhere = startDate || endDate ? getDateRange(startDate, endDate) : undefined;

  const [
    profit,
    expenses,
    bestSelling,
    topCategories,
    paymentBreakdown,
    revenueTrend,
    monthlyProfit,
  ] = await Promise.all([
    getProfitSummary(startDate, endDate),
    getExpenseSummary(startDate, endDate),
    prisma.saleLineItem.groupBy({
      by: ["itemName"],
      where: {
        sale: {
          businessId: DEFAULT_BUSINESS_ID,
          ...(dateWhere ? { soldAt: dateWhere } : {}),
        },
      },
      _sum: { quantity: true, totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    }),
    prisma.sale.groupBy({
      by: ["category"],
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        ...(dateWhere ? { soldAt: dateWhere } : {}),
      },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    }),
    prisma.sale.groupBy({
      by: ["paymentStatus"],
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        ...(dateWhere ? { soldAt: dateWhere } : {}),
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    getProfitTrend("daily", startDate, endDate),
    getProfitTrend("monthly", startDate, endDate),
  ]);

  return {
    totals: profit,
    expenses,
    bestSellingProducts: bestSelling.map((item) => ({
      itemName: item.itemName,
      quantitySold: item._sum.quantity ?? 0,
      revenue: toNumber(item._sum.totalAmount),
      transactions: item._count,
    })),
    topCategories: topCategories.map((item) => ({
      category: item.category ?? "Uncategorized",
      revenue: toNumber(item._sum.totalAmount),
      transactions: item._count,
    })),
    paymentBreakdown: paymentBreakdown.map((item) => ({
      paymentStatus: item.paymentStatus,
      revenue: toNumber(item._sum.totalAmount),
      transactions: item._count,
    })),
    revenueTrend: revenueTrend.map((item) => ({
      period: item.period,
      revenue: item.revenue,
      expenses: item.expenses,
      profit: item.profit,
    })),
    monthlySummaries: monthlyProfit,
  };
}

export async function buildExportRows(
  type: "sales" | "expenses" | "profit" | "tax-summary",
  filters: ReportFilters = {},
) {
  const { startDate, endDate } = filters;
  const dateWhere = startDate || endDate ? getDateRange(startDate, endDate) : undefined;

  if (type === "sales") {
    const sales = await prisma.sale.findMany({
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        ...(dateWhere ? { soldAt: dateWhere } : {}),
      },
      include: { customer: true },
      orderBy: { soldAt: "desc" },
    });
    return sales.map((sale) => ({
      id: sale.id,
      date: sale.soldAt.toISOString(),
      item: sale.itemName,
      category: sale.category ?? "",
      customer: sale.customer?.name ?? sale.customerName ?? "Walk-in",
      paymentStatus: sale.paymentStatus,
      paymentMethod: sale.paymentMethod ?? "",
      totalAmount: Number(sale.totalAmount),
    }));
  }

  if (type === "expenses") {
    const expenses = await prisma.expense.findMany({
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        ...(dateWhere ? { date: dateWhere } : {}),
      },
      orderBy: { date: "desc" },
    });
    return expenses.map((expense) => ({
      id: expense.id,
      date: expense.date.toISOString(),
      category: expense.category,
      vendor: expense.vendor ?? "",
      recurring: expense.recurring,
      amount: Number(expense.amount),
      notes: expense.notes ?? "",
    }));
  }

  if (type === "profit") {
    return getProfitTrend("daily", startDate, endDate);
  }

  const overview = await getBusinessOverview(filters);
  return [
    { metric: "total_revenue", value: overview.totals.totalRevenue },
    { metric: "total_expenses", value: overview.totals.totalExpenses },
    { metric: "net_profit", value: overview.totals.netProfit },
    { metric: "profit_margin_percent", value: overview.totals.profitMarginPercent },
  ];
}

