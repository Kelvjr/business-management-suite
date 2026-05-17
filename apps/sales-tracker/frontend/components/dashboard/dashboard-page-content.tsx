"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildKpiSnapshot,
  type DashboardPeriod,
  filterSalesForPeriod,
} from "@/lib/domain/dashboard-kpi-period";
import type { DashboardSignals } from "@/lib/domain/dashboard-signals";
import type { Customer, Sale } from "@/lib/api";
import type { ExportRow } from "@/lib/exporters";
import { Button } from "@/components/ui/button";
import {
  ChannelRadarPanel,
  DashboardRevenueChart,
  PaymentStatusPanel,
  SalesByDayPanel,
} from "@/components/dashboard/dashboard-charts";
import { DashboardExportMenu } from "@/components/dashboard/dashboard-export-menu";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { DashboardKpiRow } from "@/components/dashboard/dashboard-kpi-row";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { TopCategoriesCard } from "@/components/dashboard/top-categories-card";

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "last_month", label: "Last Month" },
  { id: "this_year", label: "Yearly" },
  { id: "all", label: "All" },
];

const actionOutlineClass =
  "group h-9 gap-1.5 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-stone-950 shadow-none transition-colors hover:border-[#ff6600] hover:bg-[#ff6600] hover:text-white [&_svg]:shrink-0 [&_svg]:text-stone-800 [&_svg]:transition-colors [&_svg]:group-hover:text-white";

const exportTriggerClass =
  "group h-9 gap-1.5 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-stone-950 shadow-none transition-colors hover:border-[#ff6600] hover:bg-[#ff6600] hover:text-white [&_svg]:shrink-0 [&_svg]:text-stone-800 [&_svg]:transition-colors [&_svg]:group-hover:text-white";

function buildExportRows(period: DashboardPeriod, kpis: ReturnType<typeof buildKpiSnapshot>, n: number): ExportRow[] {
  return [
    { metric: "period", value: period },
    { metric: "total_revenue", value: kpis.totalRevenue },
    { metric: "sales_count", value: kpis.salesCount },
    { metric: "aov", value: kpis.aov },
    { metric: "new_customers", value: kpis.newCustomers },
    { metric: "filtered_transactions", value: n },
  ];
}

type DashboardPageContentProps = {
  sales: Sale[];
  customers: Customer[];
  signals: DashboardSignals;
  userFirstName?: string;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDeltaPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  if (value > 0) return `+${value.toFixed(1)}%`;
  return `${value.toFixed(1)}%`;
}

function revenueDeltaClass(value: number) {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-neutral-500";
}

export function DashboardPageContent({
  sales,
  customers,
  signals,
  userFirstName = "there",
}: DashboardPageContentProps) {
  const [period, setPeriod] = useState<DashboardPeriod>("this_week");

  const filteredSales = useMemo(
    () => filterSalesForPeriod(sales, period),
    [sales, period],
  );

  const kpis = useMemo(
    () => buildKpiSnapshot(sales, customers, period),
    [sales, customers, period],
  );

  const exportRows = useMemo(
    () => buildExportRows(period, kpis, filteredSales.length),
    [period, kpis, filteredSales.length],
  );

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-lg font-medium text-gray-900">
            {getGreeting()}, {userFirstName}!
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Sales are{" "}
            <span className={revenueDeltaClass(signals.revenueDeltaPercent)}>
              {formatDeltaPercent(signals.revenueDeltaPercent)}
            </span>{" "}
            compared to last week. Keep logging your sales daily.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          <DashboardExportMenu
            rows={exportRows}
            fileBaseName="dashboard-export"
            pdfTitle="Dashboard Export"
            triggerClassName={exportTriggerClass}
          />
          <Button asChild variant="outline" className={actionOutlineClass}>
            <Link href="/reports" className="inline-flex items-center gap-1.5">
              <BarChart3 className="size-3.5" />
              View Report
            </Link>
          </Button>
          <Button
            asChild
            className="h-9 rounded-lg bg-fuchsia-700 px-4 text-sm font-medium text-white hover:bg-fuchsia-800"
          >
            <Link href="/sales/add" className="inline-flex items-center gap-1.5">
              <Plus className="size-3.5" />
              Add Sale
            </Link>
          </Button>
        </div>
      </div>

      <div className="w-full min-w-0">
        <div className="inline-flex w-full max-w-full flex-wrap items-center gap-0.5 rounded-2xl border border-black/10 bg-white p-1.5">
          {PERIODS.map((p) => {
            const active = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "shrink-0 rounded-2xl px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3",
                  active
                    ? "bg-stone-100 text-fuchsia-700"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <DashboardKpiRow kpis={kpis} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_22rem] 2xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm shadow-black/[0.02] sm:p-6">
            <DashboardRevenueChart sales={filteredSales} embedded />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="min-w-0 overflow-hidden">
              <SalesByDayPanel
                sales={filteredSales}
                className="h-full border border-black/10 shadow-sm shadow-black/[0.02]"
              />
            </div>
            <div className="min-w-0 overflow-hidden">
              <ChannelRadarPanel
                sales={filteredSales}
                className="h-full border border-black/10 shadow-sm shadow-black/[0.02]"
              />
            </div>
          </div>

          <TopCategoriesCard sales={filteredSales} />

          <div className="w-full min-w-0 rounded-2xl border border-black/10 bg-white p-4 shadow-sm shadow-black/[0.02] sm:px-6 sm:pt-6 sm:pb-4">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start sm:pr-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Recent Sales</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Latest completed and pending transactions. Filter or search as needed.
                </p>
              </div>
              <Link
                href="/sales"
                className="text-sm font-semibold text-fuchsia-700 hover:underline"
              >
                View all
              </Link>
            </div>
            <RecentSales sales={sales} tableMaxHeightClass="max-h-[min(28rem,50vh)]" />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <DashboardQuickActions compact />

          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm shadow-black/[0.02]">
            <PaymentStatusPanel
              sales={filteredSales}
              className="!rounded-2xl !border-0 !bg-transparent !shadow-none"
            />
          </div>

          <div className="min-h-0">
            <DashboardInsights signals={signals} showCardHeader />
          </div>
        </div>
      </div>
    </div>
  );
}
