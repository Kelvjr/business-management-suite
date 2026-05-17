import type { Customer, Sale } from "@/lib/api";
import { sumRevenue } from "@/lib/domain/sales-analytics";

export type DashboardPeriod =
  | "today"
  | "this_week"
  | "last_month"
  | "this_year"
  | "all";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getWeekStartMonday(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function filterSales(
  sales: Sale[],
  start: Date,
  end: Date,
) {
  const a = start.getTime();
  const b = end.getTime();
  return sales.filter((sale) => {
    const t = new Date(sale.soldAt).getTime();
    return t >= a && t <= b;
  });
}

function filterCustomersInRange(
  customers: Customer[],
  start: Date,
  end: Date,
) {
  const a = start.getTime();
  const b = end.getTime();
  return customers.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t >= a && t <= b;
  });
}

function pctDelta(current: number, previous: number) {
  if (previous > 0) return ((current - previous) / previous) * 100;
  if (current > 0) return 100;
  return 0;
}

type RangePair = { cur: { start: Date; end: Date }; prev: { start: Date; end: Date } | null; comparisonLabel: string };

export function getPeriodRanges(
  period: DashboardPeriod,
  now: Date = new Date(),
): RangePair {
  if (period === "all") {
    const start = new Date(0);
    return {
      cur: { start, end: now },
      prev: null,
      comparisonLabel: "All time",
    };
  }

  if (period === "today") {
    const start = startOfDay(now);
    const end = now;
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    const prevEnd = endOfDay(prevStart);
    return {
      cur: { start, end },
      prev: { start: prevStart, end: prevEnd },
      comparisonLabel: "vs yesterday",
    };
  }

  if (period === "this_week") {
    const start = getWeekStartMonday(now);
    const end = now;
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = new Date(start);
    prevEnd.setTime(prevEnd.getTime() - 1);
    return {
      cur: { start, end },
      prev: { start: prevStart, end: prevEnd },
      comparisonLabel: "vs previous week",
    };
  }

  if (period === "last_month") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0, 23, 59, 59, 999);
    const prevLast = new Date(y, m - 1, 0, 23, 59, 59, 999);
    const prevFirst = new Date(y, m - 2, 1);
    return {
      cur: { start: first, end: last },
      prev: { start: prevFirst, end: prevLast },
      comparisonLabel: "vs prior month",
    };
  }

  if (period === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = now;
    const dur = end.getTime() - start.getTime();
    const prevStart = new Date(start);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(prevStart.getTime() + dur);
    return {
      cur: { start, end },
      prev: { start: prevStart, end: prevEnd },
      comparisonLabel: "vs same range last year",
    };
  }

  return {
    cur: { start: startOfDay(now), end: now },
    prev: null,
    comparisonLabel: "vs previous period",
  };
}

export function filterSalesForPeriod(sales: Sale[], period: DashboardPeriod) {
  const { cur } = getPeriodRanges(period);
  return filterSales(sales, cur.start, cur.end);
}

export type KpiSnapshot = {
  totalRevenue: number;
  totalRevenueDelta: number;
  salesCount: number;
  salesCountDelta: number;
  aov: number;
  aovDelta: number;
  newCustomers: number;
  newCustomersDelta: number;
  comparisonLabel: string;
};

export function buildKpiSnapshot(
  sales: Sale[],
  customers: Customer[],
  period: DashboardPeriod,
  now: Date = new Date(),
): KpiSnapshot {
  const { cur, prev, comparisonLabel } = getPeriodRanges(period, now);
  const currentSales = filterSales(sales, cur.start, cur.end);
  const totalRevenue = sumRevenue(currentSales);
  const salesCount = currentSales.length;
  const aov = salesCount > 0 ? totalRevenue / salesCount : 0;
  const newCustomers = filterCustomersInRange(
    customers,
    cur.start,
    cur.end,
  ).length;

  if (!prev) {
    return {
      totalRevenue,
      totalRevenueDelta: 0,
      salesCount,
      salesCountDelta: 0,
      aov,
      aovDelta: 0,
      newCustomers,
      newCustomersDelta: 0,
      comparisonLabel,
    };
  }

  const previousSales = filterSales(sales, prev.start, prev.end);
  const previousRevenue = sumRevenue(previousSales);
  const previousCount = previousSales.length;
  const previousAov = previousCount > 0 ? previousRevenue / previousCount : 0;
  const prevNewCustomers = filterCustomersInRange(
    customers,
    prev.start,
    prev.end,
  ).length;

  return {
    totalRevenue,
    totalRevenueDelta: pctDelta(totalRevenue, previousRevenue),
    salesCount,
    salesCountDelta: pctDelta(salesCount, previousCount),
    aov,
    aovDelta: pctDelta(aov, previousAov),
    newCustomers,
    newCustomersDelta: pctDelta(newCustomers, prevNewCustomers),
    comparisonLabel,
  };
}
