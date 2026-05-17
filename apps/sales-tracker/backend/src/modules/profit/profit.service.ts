import { prisma } from "../../lib/prisma";
import { DEFAULT_BUSINESS_ID } from "../../core/context";
import { getExpenseTotals } from "../expenses/expenses.service";
import { getDateRange, getSalesTotals } from "../sales/sales.service";

type Period = "daily" | "weekly" | "monthly";

function marginPercent(revenue: number, profit: number) {
  if (!revenue) return 0;
  return Number(((profit / revenue) * 100).toFixed(2));
}

function getBucket(date: Date, period: Period) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  if (period === "daily") return `${year}-${month}-${day}`;
  if (period === "monthly") return `${year}-${month}`;

  const start = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
  const weekday = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - weekday + 1);
  return `${start.getUTCFullYear()}-W${String(getWeekNumber(start)).padStart(2, "0")}`;
}

function getWeekNumber(date: Date) {
  const firstDay = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const pastDays = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
  return Math.ceil((pastDays + firstDay.getUTCDay() + 1) / 7);
}

export async function getProfitSummary(startDate?: string, endDate?: string) {
  const [sales, expenses] = await Promise.all([
    getSalesTotals(startDate, endDate),
    getExpenseTotals(startDate, endDate),
  ]);
  const netProfit = sales.revenue - expenses.expenses;

  return {
    totalRevenue: sales.revenue,
    totalExpenses: expenses.expenses,
    netProfit,
    grossProfit: netProfit,
    profitMarginPercent: marginPercent(sales.revenue, netProfit),
    salesCount: sales.salesCount,
    expenseCount: expenses.expenseCount,
  };
}

export async function getProfitTrend(
  period: Period = "daily",
  startDate?: string,
  endDate?: string,
) {
  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        ...(startDate || endDate
          ? { soldAt: getDateRange(startDate, endDate) }
          : {}),
      },
      select: { soldAt: true, totalAmount: true },
    }),
    prisma.expense.findMany({
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        ...(startDate || endDate ? { date: getDateRange(startDate, endDate) } : {}),
      },
      select: { date: true, amount: true },
    }),
  ]);

  const buckets = new Map<string, { period: string; revenue: number; expenses: number }>();

  for (const sale of sales) {
    const key = getBucket(sale.soldAt, period);
    const bucket = buckets.get(key) ?? { period: key, revenue: 0, expenses: 0 };
    bucket.revenue += Number(sale.totalAmount);
    buckets.set(key, bucket);
  }

  for (const expense of expenses) {
    const key = getBucket(expense.date, period);
    const bucket = buckets.get(key) ?? { period: key, revenue: 0, expenses: 0 };
    bucket.expenses += Number(expense.amount);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((bucket) => {
      const profit = bucket.revenue - bucket.expenses;
      return {
        ...bucket,
        profit,
        margin: marginPercent(bucket.revenue, profit),
      };
    });
}

export async function saveProfitSnapshot(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const summary = await getProfitSummary(day, day);

  return prisma.profitSnapshot.upsert({
    where: {
      businessId_date: {
        businessId: DEFAULT_BUSINESS_ID,
        date: new Date(`${day}T00:00:00.000Z`),
      },
    },
    update: {
      revenue: summary.totalRevenue,
      expenses: summary.totalExpenses,
      profit: summary.netProfit,
      margin: summary.profitMarginPercent,
    },
    create: {
      businessId: DEFAULT_BUSINESS_ID,
      date: new Date(`${day}T00:00:00.000Z`),
      revenue: summary.totalRevenue,
      expenses: summary.totalExpenses,
      profit: summary.netProfit,
      margin: summary.profitMarginPercent,
    },
  });
}

