"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatCurrency, formatSaleDate } from "@/lib/format";
import type { Sale } from "@/lib/api";
import { DashboardExportMenu } from "@/components/dashboard/dashboard-export-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RecentSalesProps = {
  sales: Sale[];
  pageSize?: number;
  /** e.g. `max-h-[min(28rem,50vh)]` — table scrolls when content exceeds height. */
  tableMaxHeightClass?: string;
};

export function RecentSales({ sales, pageSize = 7, tableMaxHeightClass }: RecentSalesProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("30d");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const sale of sales) {
      if (sale.category?.trim()) set.add(sale.category.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sales]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "all" ? 0 : 30;
    const start = new Date(now);
    if (days > 0) {
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));
    }

    return sales.filter((sale) => {
      const soldAt = new Date(sale.soldAt);
      if (days > 0 && soldAt < start) return false;
      if (category !== "all" && (sale.category ?? "").trim() !== category) return false;
      if (status !== "all" && sale.paymentStatus !== status) return false;
      if (!query) return true;

      const haystack = `${sale.itemName} ${sale.customerName ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [sales, search, category, status, range]);

  const exportRows = filteredSales.map((sale) => ({
    product: sale.itemName,
    customer: sale.customerName || "Walk-in",
    amount: Number(sale.totalAmount),
    status: sale.paymentStatus,
    channel: sale.salesChannel || "—",
    date: new Date(sale.soldAt).toISOString(),
  }));

  const totalTransactions = filteredSales.length;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTransactions);
  const pagedSales = filteredSales.slice(startIndex, endIndex);

  if (!sales.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
        No sales yet.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-0 max-w-md flex-1 sm:min-w-[12rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search sales by item or customer..."
              className="h-8 w-full rounded-lg border-black/10 pl-8 text-xs"
            />
          </div>

          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-8 rounded-lg border-black/10 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all" className="text-xs">
                Category
              </SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item} className="text-xs">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-8 rounded-lg border-black/10 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all" className="text-xs">
                Status
              </SelectItem>
              <SelectItem value="paid" className="text-xs">
                Paid
              </SelectItem>
              <SelectItem value="partial" className="text-xs">
                Partial
              </SelectItem>
              <SelectItem value="unpaid" className="text-xs">
                Unpaid
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={range}
            onValueChange={(value) => {
              setRange(value);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-8 rounded-lg border-black/10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="7d" className="text-xs">
                Last 7 Days
              </SelectItem>
              <SelectItem value="30d" className="text-xs">
                Last 30 Days
              </SelectItem>
              <SelectItem value="90d" className="text-xs">
                Last 90 Days
              </SelectItem>
              <SelectItem value="all" className="text-xs">
                All Time
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="shrink-0 self-start sm:self-end">
          <DashboardExportMenu
            rows={exportRows}
            fileBaseName="recent-sales-export"
            pdfTitle="Recent Sales"
          />
        </div>
      </div>

      <div
        className={cn(
          "w-full min-w-0 rounded-xl border border-black/10",
          tableMaxHeightClass
            ? cn("overflow-auto", tableMaxHeightClass)
            : "overflow-x-auto",
        )}
      >
        <table className="w-full min-w-0 text-xs">
          <thead className="sticky top-0 z-10 bg-stone-50 text-left text-zinc-500 shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
            <tr>
              <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:py-3 sm:text-xs">
                Product details
              </th>
              <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:py-3 sm:text-xs">
                Customer
              </th>
              <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:py-3 sm:text-xs">
                Amount
              </th>
              <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:py-3 sm:text-xs">
                Status
              </th>
              <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:py-3 sm:text-xs">
                Channel
              </th>
              <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:py-3 sm:text-xs">
                Date
              </th>
              <th className="px-2 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:py-3 sm:text-xs">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedSales.map((sale) => (
              <tr key={sale.id} className="border-t border-black/10 text-gray-900">
                <td className="min-w-0 px-2 py-2.5 align-top sm:px-3 sm:py-3">
                  <p className="truncate text-xs font-semibold sm:text-sm">{sale.itemName}</p>
                  <p className="line-clamp-2 text-[10px] font-normal text-zinc-500 sm:text-xs">
                    Qty: {sale.quantity ?? 1} · {sale.category || "Uncategorized"}
                  </p>
                </td>
                <td className="min-w-0 px-2 py-2.5 align-top text-[11px] font-medium sm:px-3 sm:py-3 sm:text-sm">
                  <span className="line-clamp-2 break-words">
                    {sale.customerName || "Walk-in"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 align-top text-[11px] font-semibold sm:px-3 sm:py-3 sm:text-sm">
                  {formatCurrency(Number(sale.totalAmount))}
                </td>
                <td className="px-2 py-2.5 align-top sm:px-3 sm:py-3">
                  <span className={statusPillClass(sale.paymentStatus)}>
                    {sale.paymentStatus === "partial" ? "Partial" : sale.paymentStatus === "unpaid" ? "Unpaid" : "Paid"}
                  </span>
                </td>
                <td className="min-w-0 px-2 py-2.5 align-top text-[11px] font-normal capitalize sm:px-3 sm:py-3 sm:text-sm">
                  <span className="line-clamp-2">{(sale.salesChannel || "walk-in").replace("-", " ")}</span>
                </td>
                <td className="min-w-0 px-2 py-2.5 align-top text-[10px] text-zinc-500 sm:px-3 sm:py-3 sm:text-xs">
                  {formatSaleDate(sale.soldAt)}
                </td>
                <td className="px-2 py-2.5 text-right align-top sm:px-3 sm:py-3">
                  <Link href={`/sales/${sale.id}`} className="text-[10px] font-medium text-fuchsia-700 hover:underline sm:text-xs">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {totalTransactions === 0 ? 0 : startIndex + 1}
          </span>{" "}
          to <span className="font-semibold text-gray-900">{endIndex}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalTransactions}</span>{" "}
          transactions
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="h-7 rounded-lg border border-black/10 bg-white px-3 text-xs font-medium text-gray-900 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-7 rounded-lg border border-black/10 bg-white px-3 text-xs font-medium text-gray-900 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function statusPillClass(status: Sale["paymentStatus"]) {
  if (status === "paid") {
    return "inline-flex rounded-[20px] bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700";
  }
  if (status === "partial") {
    return "inline-flex rounded-[20px] bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700";
  }
  return "inline-flex rounded-[20px] bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700";
}
