import type { Sale } from "@/lib/api";
import { sumRevenue } from "@/lib/domain/sales-analytics";

function getWeekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = (day + 6) % 7;
  start.setDate(start.getDate() - diff);
  return start;
}

function countSalesByDateRange(sales: Sale[], start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  return sales.filter((sale) => {
    const soldAt = new Date(sale.soldAt).getTime();
    return soldAt >= startMs && soldAt < endMs;
  });
}

export function buildDashboardSignals(sales: Sale[]) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const weekStart = getWeekStart(now);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const todaySales = countSalesByDateRange(sales, todayStart, tomorrowStart);
  const thisWeekSales = countSalesByDateRange(sales, weekStart, nextWeekStart);
  const lastWeekSales = countSalesByDateRange(sales, lastWeekStart, weekStart);

  const thisWeekRevenue = sumRevenue(thisWeekSales);
  const lastWeekRevenue = sumRevenue(lastWeekSales);
  const revenueDeltaPercent =
    lastWeekRevenue > 0
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
      : 0;
  const countDeltaPercent =
    lastWeekSales.length > 0
      ? ((thisWeekSales.length - lastWeekSales.length) / lastWeekSales.length) *
        100
      : 0;

  const fourteenDaysAgo = new Date(todayStart);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const historicalByNow = sales.filter((sale) => {
    const soldAt = new Date(sale.soldAt);
    if (soldAt < fourteenDaysAgo || soldAt >= todayStart) return false;
    const soldMinutes = soldAt.getHours() * 60 + soldAt.getMinutes();
    return soldMinutes <= currentMinutes;
  }).length;

  const reminders: string[] = [];
  if (todaySales.length === 0) {
    reminders.push("You have not recorded any sales today.");
  }
  if (todaySales.length === 0 && historicalByNow > 0) {
    reminders.push("You usually sell by now. Did you forget to log today's sales?");
  }

  return {
    todaySalesCount: todaySales.length,
    reminders,
    thisWeekSalesCount: thisWeekSales.length,
    lastWeekSalesCount: lastWeekSales.length,
    thisWeekRevenue,
    lastWeekRevenue,
    revenueDeltaPercent,
    countDeltaPercent,
    isLowActivityAlert:
      lastWeekRevenue > 0 && thisWeekRevenue <= lastWeekRevenue * 0.7,
  };
}

function filterSalesInclusive(sales: Sale[], start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  return sales.filter((sale) => {
    const soldAt = new Date(sale.soldAt).getTime();
    return soldAt >= startMs && soldAt <= endMs;
  });
}

function pctDelta(current: number, previous: number) {
  if (previous > 0) return ((current - previous) / previous) * 100;
  if (current > 0) return 100;
  return 0;
}

/** Rolling last 7 days (including today) vs the prior 7 days. */
export function buildLastSevenDaysKpis(sales: Sale[]) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(-1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 6);
  prevStart.setHours(0, 0, 0, 0);

  const currentSales = filterSalesInclusive(sales, start, end);
  const previousSales = filterSalesInclusive(sales, prevStart, prevEnd);

  const revenue = sumRevenue(currentSales);
  const prevRevenue = sumRevenue(previousSales);
  const count = currentSales.length;
  const prevCount = previousSales.length;
  const aov = count > 0 ? revenue / count : 0;
  const prevAov = prevCount > 0 ? prevRevenue / prevCount : 0;

  const rangeLabel = `${start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })} - ${end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  const barDenominator = Math.max(revenue, prevRevenue, 1);

  return {
    rangeLabel,
    revenue,
    revenueDeltaPct: pctDelta(revenue, prevRevenue),
    count,
    countDeltaPct: pctDelta(count, prevCount),
    aov,
    aovDeltaPct: pctDelta(aov, prevAov),
    /** 0–100 width for summary strip */
    revenueBarPercent: Math.min(100, (revenue / barDenominator) * 100),
  };
}

export type LastSevenDaysKpis = ReturnType<typeof buildLastSevenDaysKpis>;

export type DashboardSignals = ReturnType<typeof buildDashboardSignals>;
