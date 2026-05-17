"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import type { Sale } from "@/lib/api";

const SWATCH = ["bg-fuchsia-700", "bg-orange-500", "bg-amber-500", "bg-stone-400"] as const;

export function TopCategoriesCard({ sales }: { sales: Sale[] }) {
  const rows = useMemo(() => {
    const m = new Map<string, { revenue: number; count: number }>();
    for (const s of sales) {
      const name = s.category?.trim() || "Uncategorized";
      const cur = m.get(name) ?? { revenue: 0, count: 0 };
      cur.revenue += Number(s.totalAmount);
      cur.count += 1;
      m.set(name, cur);
    }
    return Array.from(m.entries())
      .map(([name, { revenue, count }]) => ({ name, revenue, count }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [sales]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-gray-400 shadow-sm shadow-black/[0.02]">
        No category data for this period yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm shadow-black/[0.02]">
      <div className="pb-4">
        <h3 className="text-base font-semibold text-gray-900">Top categories</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Highest-performing products and services.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row, i) => (
          <div
            key={row.name}
            className="flex items-center justify-between gap-3 border-b border-black/5 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`size-2.5 shrink-0 rounded-[5px] ${SWATCH[i % SWATCH.length]}`}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{row.name}</p>
                <p className="text-xs text-gray-400">{row.count} sales</p>
              </div>
            </div>
            <p className="shrink-0 text-sm font-semibold text-gray-900">
              {formatCurrency(row.revenue)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
