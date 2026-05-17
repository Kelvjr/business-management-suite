"use client";

import { Banknote, DollarSign, Hash, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KpiSnapshot } from "@/lib/domain/dashboard-kpi-period";

function formatDeltaPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  if (value > 0) return `+${value.toFixed(1)}%`;
  return `${value.toFixed(1)}%`;
}

function DeltaPill({ value }: { value: number }) {
  const positive = value > 0;
  const flat = Math.abs(value) < 0.05;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-2xl px-1.5 py-0.5 text-[10px] font-semibold",
        flat && "bg-zinc-200/80 text-zinc-700",
        !flat && positive && "bg-emerald-500/20 text-emerald-600",
        !flat && !positive && "bg-rose-600/20 text-rose-600",
      )}
    >
      {formatDeltaPercent(value)}
    </span>
  );
}

export function DashboardKpiRow({ kpis }: { kpis: KpiSnapshot }) {
  const cards = [
    {
      label: "Total Revenue",
      value: formatCurrency(kpis.totalRevenue),
      delta: kpis.totalRevenueDelta,
      sub: kpis.comparisonLabel,
      Icon: DollarSign,
    },
    {
      label: "Number of Sales",
      value: String(kpis.salesCount),
      delta: kpis.salesCountDelta,
      sub: kpis.comparisonLabel,
      Icon: Hash,
    },
    {
      label: "Average Sale Value",
      value: formatCurrency(kpis.aov),
      delta: kpis.aovDelta,
      sub: kpis.comparisonLabel,
      Icon: Banknote,
    },
    {
      label: "New Customers",
      value: String(kpis.newCustomers),
      delta: kpis.newCustomersDelta,
      sub: kpis.comparisonLabel,
      Icon: Users,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, delta, sub, Icon }) => (
        <div
          key={label}
          className="flex min-h-[9.5rem] flex-col rounded-2xl border border-black/10 bg-white p-4 shadow-sm shadow-black/[0.02]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-gray-400">{label}</p>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-stone-800">
              <Icon className="size-3.5" />
            </span>
          </div>
          <p className="mt-1.5 text-xl font-bold tabular-nums leading-tight text-gray-900 sm:text-2xl">
            {value}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <p className="text-[10px] font-medium text-gray-400">{sub}</p>
            <DeltaPill value={delta} />
          </div>
        </div>
      ))}
    </div>
  );
}
