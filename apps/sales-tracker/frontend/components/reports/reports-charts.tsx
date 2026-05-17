"use client"

import type { Sale } from "@/lib/api"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/format"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

type ReportsChartsProps = {
  sales: Sale[]
}

function getRevenueTimeline(sales: Sale[]) {
  const grouped = new Map<string, number>()

  for (const sale of sales) {
    const key = new Date(sale.soldAt).toLocaleDateString()
    grouped.set(key, (grouped.get(key) || 0) + Number(sale.totalAmount))
  }

  return Array.from(grouped.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function getTopProducts(sales: Sale[]) {
  const grouped = new Map<string, number>()

  for (const sale of sales) {
    const key = sale.itemName || "Unnamed Item"
    grouped.set(key, (grouped.get(key) || 0) + Number(sale.totalAmount))
  }

  return Array.from(grouped.entries())
    .map(([product, revenue]) => ({ product, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
}

function getBreakdown(
  sales: Sale[],
  selector: (sale: Sale) => string,
  fallback: string,
) {
  const grouped = new Map<string, number>()

  for (const sale of sales) {
    const key = selector(sale) || fallback
    grouped.set(key, (grouped.get(key) || 0) + Number(sale.totalAmount))
  }

  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }))
}

const timelineConfig = {
  revenue: {
    label: "Revenue",
    color: "#9100BD",
  },
} satisfies ChartConfig

const topProductsConfig = {
  revenue: {
    label: "Revenue",
    color: "#FF6600",
  },
} satisfies ChartConfig

const statusConfig = {
  paid: { label: "Paid", color: "#22c55e" },
  partial: { label: "Partial", color: "#f59e0b" },
  unpaid: { label: "Unpaid", color: "#ef4444" },
  unknown: { label: "Unknown", color: "#9100BD" },
} satisfies ChartConfig

const channelConfig = {
  "walk-in": { label: "Walk-in", color: "#9100BD" },
  whatsapp: { label: "WhatsApp", color: "#FF6600" },
  instagram: { label: "Instagram", color: "#6366f1" },
  phone: { label: "Phone", color: "#14b8a6" },
  website: { label: "Website", color: "#eab308" },
  unknown: { label: "Unknown", color: "#9ca3af" },
} satisfies ChartConfig

export function ReportsCharts({ sales }: ReportsChartsProps) {
  const revenueTimeline = getRevenueTimeline(sales)
  const topProducts = getTopProducts(sales)
  const statusBreakdown = getBreakdown(
    sales,
    (sale) => sale.paymentStatus || "unknown",
    "unknown",
  )
  const channelBreakdown = getBreakdown(
    sales,
    (sale) => sale.salesChannel || "unknown",
    "unknown",
  )

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="premium-card p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold">Revenue Over Time</p>
          <p className="text-[11px] text-muted-foreground">Filtered period trend</p>
        </div>
        <ChartContainer config={timelineConfig} className="h-[280px]">
          <LineChart data={revenueTimeline} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(Number(value))}
              width={84}
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

      <div className="premium-card p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold">Top Products</p>
          <p className="text-[11px] text-muted-foreground">Highest revenue items</p>
        </div>
        <ChartContainer config={topProductsConfig} className="h-[280px]">
          <BarChart data={topProducts} layout="vertical" margin={{ left: 16, right: 12 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            <YAxis
              dataKey="product"
              type="category"
              width={110}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="premium-card p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold">Sales by Payment Status</p>
          <p className="text-[11px] text-muted-foreground">Revenue split</p>
        </div>
        <ChartContainer config={statusConfig} className="h-[280px]">
          <PieChart>
            <Pie
              data={statusBreakdown}
              dataKey="value"
              nameKey="name"
              outerRadius={92}
              innerRadius={42}
              strokeWidth={0}
            >
              {statusBreakdown.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={`var(--color-${entry.name})`}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </div>

      <div className="premium-card p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold">Sales by Channel</p>
          <p className="text-[11px] text-muted-foreground">Revenue split</p>
        </div>
        <ChartContainer config={channelConfig} className="h-[280px]">
          <PieChart>
            <Pie
              data={channelBreakdown}
              dataKey="value"
              nameKey="name"
              outerRadius={92}
              innerRadius={52}
              strokeWidth={0}
            >
              {channelBreakdown.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={`var(--color-${entry.name})`}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  )
}
