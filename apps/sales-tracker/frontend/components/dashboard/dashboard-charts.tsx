"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Sale } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type ChartProps = {
  sales: Sale[];
};

function getRevenueTrendForDays(sales: Sale[], daysCount: number) {
  const days = Array.from({ length: daysCount }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (daysCount - 1 - index));
    return date;
  });

  return days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const total = sales
      .filter((sale) => {
        const soldAt = new Date(sale.soldAt);
        return soldAt >= day && soldAt < next;
      })
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    return {
      day: day.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      revenue: total,
    };
  });
}

type RevenueTrendPeriod = "7d" | "30d" | "90d";

const REVENUE_TREND_LABELS: Record<RevenueTrendPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const REVENUE_TREND_DAYS: Record<RevenueTrendPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function getWeekStartMonday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekdayCountsInRange(sales: Sale[], start: Date, end: Date) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = new Array(7).fill(0);
  const startMs = start.getTime();
  const endMs = end.getTime();

  for (const sale of sales) {
    const soldAt = new Date(sale.soldAt).getTime();
    if (soldAt < startMs || soldAt > endMs) continue;
    const day = new Date(sale.soldAt).getDay();
    const mondayFirst = (day + 6) % 7;
    counts[mondayFirst] += 1;
  }

  return labels.map((label, index) => ({ day: label, sales: counts[index] }));
}

type SalesByDayPeriod = "thisWeek" | "lastWeek" | "last2Weeks";

function getWeekdaySalesForPeriod(sales: Sale[], period: SalesByDayPeriod) {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  if (period === "thisWeek") {
    const weekStart = getWeekStartMonday(now);
    return getWeekdayCountsInRange(sales, weekStart, todayEnd);
  }

  if (period === "lastWeek") {
    const thisWeekStart = getWeekStartMonday(now);
    const lastWeekStart = addDays(thisWeekStart, -7);
    const lastWeekEnd = addDays(lastWeekStart, 6);
    lastWeekEnd.setHours(23, 59, 59, 999);
    return getWeekdayCountsInRange(sales, lastWeekStart, lastWeekEnd);
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 13);
  return getWeekdayCountsInRange(sales, start, todayEnd);
}

const SALES_BY_DAY_LABELS: Record<SalesByDayPeriod, string> = {
  thisWeek: "This week",
  lastWeek: "Last week",
  last2Weeks: "Last 2 weeks",
};

function getStatusBreakdown(sales: Sale[]) {
  const grouped = new Map<string, number>();

  for (const sale of sales) {
    const key = sale.paymentStatus || "unknown";
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
}

function getChannelBreakdown(sales: Sale[]) {
  const grouped = new Map<string, number>();

  for (const sale of sales) {
    const key = sale.salesChannel || "walk-in";
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
}

const lineChartConfig = {
  revenue: {
    label: "Revenue",
    color: "#9100BD",
  },
} satisfies ChartConfig;

const barChartConfig = {
  sales: {
    label: "Sales",
    color: "#FF6600",
  },
  label: {
    color: "hsl(0 0% 100%)",
  },
} satisfies ChartConfig;

/** Paid = green, partial = yellow, unpaid = red; other statuses roll into unpaid */
const paymentPieChartConfig = {
  count: {
    label: "Sales",
  },
  paid: {
    label: "Paid",
    color: "#22c55e",
  },
  partial: {
    label: "Partial",
    color: "#eab308",
  },
  unpaid: {
    label: "Unpaid",
    color: "#ef4444",
  },
} satisfies ChartConfig;

function paymentPieSliceLabel(status: string) {
  if (status === "paid") return paymentPieChartConfig.paid.label;
  if (status === "partial") return paymentPieChartConfig.partial.label;
  if (status === "unpaid") return paymentPieChartConfig.unpaid.label;
  return status;
}

const channelRadarChartConfig = {
  count: {
    label: "Sales",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const CHANNEL_COLORS = ["#9100BD", "#FF6600", "#16a34a"] as const;

const PAYMENT_LABELS = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
} as const;

const PAYMENT_COLORS = {
  paid: "#16a34a",
  partial: "#f59e0b",
  unpaid: "#e11d48",
} as const;

function formatRadarChannelLabel(name: string) {
  const n = name.trim() || "Unknown";
  return n.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type RevenueChartProps = ChartProps & {
  embedded?: boolean;
};

export function DashboardRevenueChart({
  sales,
  embedded = false,
}: RevenueChartProps) {
  const [trendPeriod, setTrendPeriod] = useState<RevenueTrendPeriod>("7d");
  const revenueTrend = useMemo(
    () => getRevenueTrendForDays(sales, REVENUE_TREND_DAYS[trendPeriod]),
    [sales, trendPeriod],
  );

  const inner = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            className={cn(
              "font-medium text-black",
              embedded ? "text-base font-semibold" : "text-base",
            )}
          >
            Revenue over time
          </h3>
          {embedded ? (
            <p className="mt-0.5 text-xs font-normal text-gray-400">
              Revenue performance across the selected time range.
            </p>
          ) : null}
        </div>
        <Select
          value={trendPeriod}
          onValueChange={(value) => setTrendPeriod(value as RevenueTrendPeriod)}
        >
          <SelectTrigger
            size="sm"
            className={cn(
              "rounded-[5px] border-stone-300 bg-white text-xs font-medium text-black shadow-none",
              embedded ? "h-8 w-[132px]" : "h-7 w-[124px]",
            )}
            aria-label="Select revenue time range"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-[10px]">
            {(Object.keys(REVENUE_TREND_LABELS) as RevenueTrendPeriod[]).map(
              (key) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {REVENUE_TREND_LABELS[key]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      <div
        className={cn(
          "rounded-2xl bg-indigo-100 p-3",
          embedded ? "mt-6 min-h-[340px]" : "mt-3 min-h-[320px]",
        )}
      >
        <ChartContainer
          config={lineChartConfig}
          className={cn("w-full", embedded ? "h-[380px]" : "h-[340px]")}
        >
          <LineChart data={revenueTrend} margin={{ top: 8, right: 12, left: 12, bottom: 18 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(Number(value))}
              tickLine={false}
              axisLine={false}
              width={88}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-0">{inner}</div>;
  }

  return <div className="rounded-2xl bg-white p-4 shadow-sm">{inner}</div>;
}

const secondaryChartH = "h-[240px]";

const secondaryTitleClass = "text-sm font-medium leading-tight text-black";

const secondaryHeaderRow = "flex min-h-10 shrink-0 items-center gap-2";

const secondaryChartWell = "mt-2 rounded-2xl bg-indigo-100 p-2";

const secondaryCardShell =
  "flex h-full min-h-0 min-w-0 flex-col rounded-[20px] bg-white px-3 pt-2 pb-2";

type PanelCommon = {
  className?: string;
};

export function PaymentStatusPanel({ sales, className }: ChartProps & PanelCommon) {
  const statusBreakdown = getStatusBreakdown(sales);

  const paymentPieData = useMemo(() => {
    const base = { paid: 0, partial: 0, unpaid: 0 };
    for (const { name, value } of statusBreakdown) {
      if (name === "paid") base.paid += value;
      else if (name === "partial") base.partial += value;
      else base.unpaid += value;
    }
    return [
      {
        status: "paid" as const,
        count: base.paid,
        fill: "var(--color-paid)",
      },
      {
        status: "partial" as const,
        count: base.partial,
        fill: "var(--color-partial)",
      },
      {
        status: "unpaid" as const,
        count: base.unpaid,
        fill: "var(--color-unpaid)",
      },
    ];
  }, [statusBreakdown]);

  const paymentLegendRows = useMemo(() => {
    const total = paymentPieData.reduce((sum, row) => sum + row.count, 0);
    return paymentPieData.map((row) => ({
      key: row.status,
      label: PAYMENT_LABELS[row.status],
      count: row.count,
      pct: total > 0 ? Math.round((row.count / total) * 100) : 0,
      color: PAYMENT_COLORS[row.status],
    }));
  }, [paymentPieData]);

  return (
    <div className={cn(secondaryCardShell, className)}>
      <div className={secondaryHeaderRow}>
        <h3 className={secondaryTitleClass}>Sales by payment status</h3>
      </div>
      <div
        className={`${secondaryChartWell} flex flex-1 flex-col items-center justify-end`}
      >
        <ChartContainer
          config={paymentPieChartConfig}
          className="mx-auto aspect-square w-full max-w-[min(100%,240px)] [&_.recharts-text]:fill-background"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => {
                    const status = (item.payload as { status?: string })?.status;
                    return `${paymentPieSliceLabel(status ?? "")}: ${value}`;
                  }}
                />
              }
            />
            <Pie
              data={paymentPieData}
              dataKey="count"
              nameKey="status"
              strokeWidth={0}
            >
              <LabelList
                dataKey="status"
                className="fill-background"
                stroke="none"
                fontSize={11}
                formatter={(value) => paymentPieSliceLabel(String(value ?? ""))}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <div className="mt-3 space-y-2 px-1">
        {paymentLegendRows.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span className="text-xs text-zinc-500">{row.label}</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">
              {row.pct}% ({row.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SalesByDayPanel({ sales, className }: ChartProps & PanelCommon) {
  const [dayPeriod, setDayPeriod] = useState<SalesByDayPeriod>("thisWeek");

  const weekdaySales = useMemo(
    () => getWeekdaySalesForPeriod(sales, dayPeriod),
    [sales, dayPeriod],
  );

  return (
    <div className={cn(secondaryCardShell, className)}>
      <div className={`${secondaryHeaderRow} justify-between`}>
        <h3 className={secondaryTitleClass}>Sales by day</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-8 shrink-0 gap-1 rounded-[5px] border-stone-300 bg-white px-2.5 text-xs font-medium text-black shadow-none"
            >
              {SALES_BY_DAY_LABELS[dayPeriod]}
              <ChevronDown className="size-3.5 text-neutral-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            {(Object.keys(SALES_BY_DAY_LABELS) as SalesByDayPeriod[]).map((key) => (
              <DropdownMenuItem
                key={key}
                onSelect={() => setDayPeriod(key)}
                className="text-xs"
              >
                {SALES_BY_DAY_LABELS[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className={`${secondaryChartWell} flex flex-1 flex-col justify-end`}>
        <ChartContainer
          config={barChartConfig}
          className={`${secondaryChartH} w-full`}
        >
          <BarChart
            accessibilityLayer
            data={weekdaySales}
            margin={{ left: 12, right: 12, top: 8, bottom: 4 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar
              dataKey="sales"
              fill="var(--color-sales)"
              radius={4}
              maxBarSize={28}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

export function ChannelRadarPanel({ sales, className }: ChartProps & PanelCommon) {
  const channelBreakdown = getChannelBreakdown(sales);

  const channelRadarData = useMemo(
    () =>
      channelBreakdown.length
        ? channelBreakdown.map(({ name, value }) => ({
            channel: formatRadarChannelLabel(name),
            count: value,
          }))
        : [{ channel: "—", count: 0 }],
    [channelBreakdown],
  );

  const channelLegendRows = useMemo(() => {
    const sorted = [...channelBreakdown]
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
    const total = channelBreakdown.reduce((sum, row) => sum + row.value, 0);
    return sorted.map((row, idx) => ({
      key: row.name,
      label: formatRadarChannelLabel(row.name),
      pct: total > 0 ? Math.round((row.value / total) * 100) : 0,
      color: CHANNEL_COLORS[idx % CHANNEL_COLORS.length],
    }));
  }, [channelBreakdown]);

  return (
    <div className={cn(secondaryCardShell, className)}>
      <div className={secondaryHeaderRow}>
        <h3 className={secondaryTitleClass}>Sales by channel</h3>
      </div>
      <div className={`${secondaryChartWell} flex flex-1 flex-col justify-end`}>
        <ChartContainer
          config={channelRadarChartConfig}
          className={`${secondaryChartH} mx-auto w-full max-w-[min(100%,240px)] aspect-square [&_.recharts-polar-angle-axis-tick_tspan]:text-[10px]`}
        >
          <RadarChart
            data={channelRadarData}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="channel" />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
              stroke="var(--color-count)"
              strokeWidth={1}
              dot={{
                r: 3,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </div>
      <div className="mt-3 space-y-2 px-1">
        {channelLegendRows.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span className="text-xs text-zinc-500">{row.label}</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">{row.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSecondaryCharts({ sales }: ChartProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_2fr_1fr]">
      <PaymentStatusPanel sales={sales} />
      <SalesByDayPanel sales={sales} />
      <ChannelRadarPanel sales={sales} />
    </div>
  );
}
