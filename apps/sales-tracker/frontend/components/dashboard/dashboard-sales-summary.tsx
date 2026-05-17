"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Sale } from "@/lib/api";
import { sumRevenue } from "@/lib/domain/sales-analytics";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type DashboardSalesSummaryProps = {
  sales: Sale[];
  /** When true, omit outer white card (for use inside a combined dashboard column). */
  embedded?: boolean;
};

type SummaryPeriod = "weekly" | "monthly" | "yearly";

type PeriodKpis = {
  rangeLabel: string;
  totalRevenue: number;
  totalRevenueDeltaPct: number;
  salesCount: number;
  salesCountDeltaPct: number;
  aov: number;
  aovDeltaPct: number;
  topCategory: string;
  topCategoryDeltaPct: number;
  pendingPaymentsCount: number;
  pendingPaymentsDeltaPct: number;
  comparisonLabel: string;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getWeekStartMonday(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function getCurrentPeriodRange(period: SummaryPeriod, now: Date) {
  const end = endOfDay(now);
  if (period === "weekly") {
    return { start: getWeekStartMonday(now), end };
  }
  if (period === "monthly") {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    return { start, end };
  }
  const start = startOfDay(new Date(now.getFullYear(), 0, 1));
  return { start, end };
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

function formatRangeLabel(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-GB", {
      day: "numeric",
      year: "numeric",
    })}`;
  }

  if (sameYear) {
    return `${start.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return `${start.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${end.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function topCategoryRevenue(sales: Sale[]) {
  const grouped = new Map<string, number>();
  for (const sale of sales) {
    const key = sale.category?.trim() || "Uncategorized";
    grouped.set(key, (grouped.get(key) || 0) + Number(sale.totalAmount));
  }
  let bestCategory = "Uncategorized";
  let bestRevenue = 0;
  for (const [category, revenue] of grouped.entries()) {
    if (revenue > bestRevenue) {
      bestCategory = category;
      bestRevenue = revenue;
    }
  }
  return { category: bestCategory, revenue: bestRevenue };
}

function buildPeriodKpis(sales: Sale[], period: SummaryPeriod): PeriodKpis {
  const now = new Date();
  const { start, end } = getCurrentPeriodRange(period, now);
  const periodMs = end.getTime() - start.getTime() + 1;
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs + 1);

  const currentSales = filterSalesInclusive(sales, start, end);
  const previousSales = filterSalesInclusive(sales, prevStart, prevEnd);

  const totalRevenue = sumRevenue(currentSales);
  const previousRevenue = sumRevenue(previousSales);
  const salesCount = currentSales.length;
  const previousCount = previousSales.length;
  const aov = salesCount > 0 ? totalRevenue / salesCount : 0;
  const previousAov = previousCount > 0 ? previousRevenue / previousCount : 0;

  const currentTopCategory = topCategoryRevenue(currentSales);
  const previousGrouped = new Map<string, number>();
  for (const sale of previousSales) {
    const key = sale.category?.trim() || "Uncategorized";
    previousGrouped.set(key, (previousGrouped.get(key) || 0) + Number(sale.totalAmount));
  }
  const previousTopForCurrentCategory =
    previousGrouped.get(currentTopCategory.category) || 0;

  const pendingPaymentsCount = currentSales.filter(
    (sale) => sale.paymentStatus !== "paid",
  ).length;
  const previousPendingPaymentsCount = previousSales.filter(
    (sale) => sale.paymentStatus !== "paid",
  ).length;

  const comparisonLabel =
    period === "weekly"
      ? "vs previous week"
      : period === "monthly"
        ? "vs previous month"
        : "vs previous year";

  return {
    rangeLabel: formatRangeLabel(start, end),
    totalRevenue,
    totalRevenueDeltaPct: pctDelta(totalRevenue, previousRevenue),
    salesCount,
    salesCountDeltaPct: pctDelta(salesCount, previousCount),
    aov,
    aovDeltaPct: pctDelta(aov, previousAov),
    topCategory: currentTopCategory.category,
    topCategoryDeltaPct: pctDelta(
      currentTopCategory.revenue,
      previousTopForCurrentCategory,
    ),
    pendingPaymentsCount,
    pendingPaymentsDeltaPct: pctDelta(
      pendingPaymentsCount,
      previousPendingPaymentsCount,
    ),
    comparisonLabel,
  };
}

function formatDeltaPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  if (value > 0) return `+${value.toFixed(1)}%`;
  return `${value.toFixed(1)}%`;
}

function DeltaPill({ value }: { value: number }) {
  const positive = value > 0;
  const flat = value === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[20px] px-2 py-0.5 text-xs font-medium",
        flat && "bg-zinc-200/80 text-zinc-700",
        !flat && positive && "bg-green-500/25 text-lime-700",
        !flat && !positive && "bg-red-600/25 text-red-600",
      )}
    >
      {formatDeltaPercent(value)}
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string;
  delta: number;
  sub: string;
}) {
  return (
    <div className="relative flex min-h-[7rem] w-[220px] flex-none flex-col rounded-2xl bg-white p-3">
      <p className="pr-8 text-xs font-medium text-neutral-400">{label}</p>
      <span className="absolute right-3 top-3 inline-flex gap-0.5">
        <span className="size-1 rounded-full bg-stone-950" />
        <span className="size-1 rounded-full bg-stone-950" />
        <span className="size-1 rounded-full bg-stone-950" />
      </span>
      <p className="mt-1 line-clamp-1 text-xl font-medium text-black">{value}</p>
      <div className="mt-auto flex items-center justify-between pt-3">
        <p className="text-xs font-medium text-neutral-400">{sub}</p>
        <DeltaPill value={delta} />
      </div>
    </div>
  );
}

export function DashboardSalesSummary({
  sales,
  embedded = false,
}: DashboardSalesSummaryProps) {
  const [period, setPeriod] = useState<SummaryPeriod>("weekly");
  const kpis = useMemo(() => buildPeriodKpis(sales, period), [sales, period]);

  const body = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-black">Sales Summary</h2>
        <div className="flex h-8 items-center overflow-hidden rounded-[5px] border border-stone-300 bg-white">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as SummaryPeriod)}
              className="h-8 appearance-none bg-transparent pl-2 pr-5 text-xs font-medium capitalize text-black outline-none"
              aria-label="Summary period"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-neutral-500">
              ▼
            </span>
          </div>
          <div className="mx-1 h-6 w-px bg-stone-300" aria-hidden />
          <div className="flex h-full items-center px-2 text-xs font-medium text-black">
            {kpis.rangeLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-indigo-100 p-3">
        <ScrollArea
          className="relative w-full whitespace-nowrap pb-5"
          role="region"
          aria-label="Sales summary cards"
        >
          <div className="flex min-w-max gap-3">
            <KpiCard
              label="Total Revenue"
              value={formatCurrency(kpis.totalRevenue)}
              delta={kpis.totalRevenueDeltaPct}
              sub={kpis.comparisonLabel}
            />
            <KpiCard
              label="Number of Sales"
              value={String(kpis.salesCount)}
              delta={kpis.salesCountDeltaPct}
              sub={kpis.comparisonLabel}
            />
            <KpiCard
              label="Average Order Value"
              value={formatCurrency(kpis.aov)}
              delta={kpis.aovDeltaPct}
              sub={kpis.comparisonLabel}
            />
            <KpiCard
              label="Top Categories"
              value={kpis.topCategory}
              delta={kpis.topCategoryDeltaPct}
              sub={kpis.comparisonLabel}
            />
            <KpiCard
              label="Pending Payments"
              value={String(kpis.pendingPaymentsCount)}
              delta={kpis.pendingPaymentsDeltaPct}
              sub={kpis.comparisonLabel}
            />
          </div>
          <ScrollBar
            orientation="horizontal"
            className="!mt-0 absolute inset-x-0 bottom-0"
          />
        </ScrollArea>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-0">{body}</div>;
  }

  return <div className="rounded-2xl bg-white p-4 shadow-sm">{body}</div>;
}
