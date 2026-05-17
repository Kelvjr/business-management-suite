import { AppShell } from "@/components/layout/app-shell";
import { ExportActions } from "@/components/shared/export-actions";
import { PageIntro } from "@/components/shared/page-intro";
import { ReportsFilters } from "@/components/reports/reports-filters";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSales, fetchSalesSummary } from "@/lib/api";
import {
  buildCategoryBreakdown,
  buildChannelBreakdown,
  buildProductInsights,
  buildStatusBreakdown,
  buildTodayVsYesterday,
  buildTopCustomers,
  buildTopItems,
  filterSalesByDateRange,
  sumRevenue,
} from "@/lib/domain/sales-analytics";
import { formatCurrency } from "@/lib/format";

type ReportsPageProps = {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;

  const [summary, sales] = await Promise.all([
    fetchSalesSummary(),
    fetchSales(),
  ]);

  const filteredSales = filterSalesByDateRange(
    sales,
    params.startDate,
    params.endDate,
  );

  const filteredRevenue = sumRevenue(filteredSales);
  const categoryBreakdown = buildCategoryBreakdown(filteredSales);
  const channelBreakdown = buildChannelBreakdown(filteredSales);
  const statusBreakdown = buildStatusBreakdown(filteredSales);
  const topCustomers = buildTopCustomers(filteredSales);
  const topItems = buildTopItems(filteredSales);
  const productInsights = buildProductInsights(filteredSales);
  const comparison = buildTodayVsYesterday(sales);
  const averageSaleValue = filteredSales.length
    ? filteredRevenue / filteredSales.length
    : 0;

  const reportDataRows = filteredSales.map((sale) => ({
    id: sale.id,
    itemType: sale.itemType,
    itemName: sale.itemName,
    category: sale.category ?? "",
    subcategory: sale.subcategory ?? "",
    quantity: sale.quantity ?? "",
    unitPrice: Number(sale.unitPrice ?? 0),
    totalAmount: Number(sale.totalAmount),
    paymentStatus: sale.paymentStatus,
    salesChannel: sale.salesChannel ?? "",
    customerName: sale.customerName ?? "",
    soldAt: new Date(sale.soldAt).toISOString(),
  }));

  const analyticsRows = [
    {
      section: "summary",
      label: "all_time_revenue",
      value: Number(summary.totalRevenue),
    },
    {
      section: "summary",
      label: "filtered_revenue",
      value: filteredRevenue,
    },
    {
      section: "summary",
      label: "sales_today",
      value: Number(summary.salesToday),
    },
    {
      section: "summary",
      label: "sales_this_month",
      value: Number(summary.salesThisMonth),
    },
    {
      section: "summary",
      label: "filtered_sales_count",
      value: filteredSales.length,
    },
    {
      section: "summary",
      label: "all_time_sales_count",
      value: Number(summary.totalSalesCount ?? sales.length),
    },
    {
      section: "summary",
      label: "average_sale_value",
      value: averageSaleValue,
    },
    {
      section: "today_vs_yesterday",
      label: "today_sales_count",
      value: comparison.todayCount,
    },
    {
      section: "today_vs_yesterday",
      label: "yesterday_sales_count",
      value: comparison.yesterdayCount,
    },
    {
      section: "today_vs_yesterday",
      label: "sales_count_delta",
      value: comparison.countDelta,
    },
    {
      section: "today_vs_yesterday",
      label: "today_revenue",
      value: comparison.todayRevenue,
    },
    {
      section: "today_vs_yesterday",
      label: "yesterday_revenue",
      value: comparison.yesterdayRevenue,
    },
    {
      section: "today_vs_yesterday",
      label: "revenue_delta",
      value: comparison.revenueDelta,
    },
    ...categoryBreakdown.map((item) => ({
      section: "revenue_by_category",
      label: item.category,
      value: item.total,
    })),
    ...channelBreakdown.map((item) => ({
      section: "revenue_by_channel",
      label: item.channel,
      value: item.total,
    })),
    ...statusBreakdown.map((item) => ({
      section: "revenue_by_status",
      label: item.status,
      value: item.total,
    })),
    ...topCustomers.map((item) => ({
      section: "top_customers",
      label: item.customer,
      value: item.total,
    })),
    ...topItems.map((item) => ({
      section: "top_items",
      label: item.item,
      value: item.total,
      count: item.count,
    })),
    ...productInsights.map((item) => ({
      section: "product_insights",
      label: item.itemName,
      value: item.revenue,
      sales_count: item.salesCount,
    })),
  ];

  return (
    <AppShell>
      <div className="relative -mx-4 -mt-4 mb-4 bg-[#E6E6FA] px-4 pb-8 pt-4 lg:-mx-6 lg:px-8">
        <div className="mx-auto max-w-[1164px] space-y-6">
          <PageIntro
            title="Reports"
            description="Business insights based on recorded sales."
          />

          <Card className="rounded-[20px] border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Export Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-[11px] font-medium">Filtered Sales Data</p>
                <ExportActions
                  rows={reportDataRows}
                  fileBaseName="report-filtered-sales"
                  pdfTitle="Filtered Sales Report"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-medium">Analytics Snapshot</p>
                <ExportActions
                  rows={analyticsRows}
                  fileBaseName="report-analytics"
                  pdfTitle="Reports Analytics Snapshot"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Filter Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportsFilters
                startDate={params.startDate}
                endDate={params.endDate}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReportCard
              title="All-Time Revenue"
              value={formatCurrency(summary.totalRevenue)}
            />
            <ReportCard
              title="Filtered Revenue"
              value={formatCurrency(filteredRevenue)}
            />
            <ReportCard
              title="Sales Count"
              value={String(filteredSales.length)}
            />
            <ReportCard
              title="Sales Today"
              value={formatCurrency(summary.salesToday)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReportCard
              title="Today Sales Count"
              value={String(comparison.todayCount)}
              subtext={`Yesterday: ${comparison.yesterdayCount} (${formatSignedNumber(
                comparison.countDelta,
              )})`}
            />
            <ReportCard
              title="Today Revenue"
              value={formatCurrency(comparison.todayRevenue)}
              subtext={`Yesterday: ${formatCurrency(
                comparison.yesterdayRevenue,
              )} (${formatSignedCurrency(comparison.revenueDelta)})`}
            />
            <ReportCard
              title="This Month"
              value={formatCurrency(summary.salesThisMonth)}
            />
            <ReportCard
              title="All-Time Sales Count"
              value={String(Number(summary.totalSalesCount ?? sales.length))}
            />
          </div>

          <ReportsCharts sales={filteredSales} />

          <div className="grid gap-6 xl:grid-cols-2">
            <InsightListCard
              title="Revenue by Category"
              items={categoryBreakdown.map((item) => ({
                label: item.category,
                value: formatCurrency(item.total),
              }))}
              emptyText="No category data yet."
            />

            <InsightListCard
              title="Revenue by Sales Channel"
              items={channelBreakdown.map((item) => ({
                label: item.channel,
                value: formatCurrency(item.total),
              }))}
              emptyText="No sales channel data yet."
            />

            <InsightListCard
              title="Revenue by Payment Status"
              items={statusBreakdown.map((item) => ({
                label: item.status,
                value: formatCurrency(item.total),
              }))}
              emptyText="No payment status data yet."
            />

            <InsightListCard
              title="Top Customers"
              items={topCustomers.map((item) => ({
                label: item.customer,
                value: formatCurrency(item.total),
              }))}
              emptyText="No customer data yet."
            />

            <InsightListCard
              title="Top-Selling Items"
              items={topItems.map((item) => ({
                label: `${item.item} (${item.count})`,
                value: formatCurrency(item.total),
              }))}
              emptyText="No item data yet."
            />

            <InsightListCard
              title="Product Insights (Grouped by Item)"
              items={productInsights.slice(0, 10).map((item) => ({
                label: item.itemName,
                value: `${formatCurrency(item.revenue)} • ${item.salesCount} sales`,
              }))}
              emptyText="No product insight data yet."
            />

            <Card className="rounded-[20px] border-0 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Filtered Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-[11px] font-medium">Sales Count</span>
                  <span className="text-[11px] text-muted-foreground">
                    {filteredSales.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-[11px] font-medium">Average Sale Value</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatCurrency(averageSaleValue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ReportCard({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string;
  subtext?: string;
}) {
  const toneClass = getReportToneClass(subtext);
  return (
    <Card className={`rounded-[20px] border-0 shadow-sm ${toneClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold tracking-tight">{value}</p>
        {subtext ? (
          <p className="mt-1 text-[10px] text-muted-foreground">{subtext}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function getReportToneClass(subtext?: string) {
  if (!subtext) return "bg-white";
  if (/\(\s*[-−]/.test(subtext)) return "bg-red-50";
  if (/\(\s*\+/.test(subtext)) return "bg-green-50";
  return "bg-yellow-50";
}

function formatSignedNumber(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatSignedCurrency(value: number) {
  if (value > 0) return `+${formatCurrency(value)}`;
  return formatCurrency(value);
}

function InsightListCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { label: string; value: string }[];
  emptyText: string;
}) {
  return (
    <Card className="rounded-[20px] border-0 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!items.length ? (
          <div className="rounded-xl border border-dashed p-8 text-[11px] text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-xl border p-3 ${getInsightToneClass(title, item.label)}`}
              >
                <span className="text-[11px] font-medium capitalize">
                  {item.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getInsightToneClass(title: string, label: string) {
  const t = title.toLowerCase();
  const l = label.toLowerCase();

  if (t.includes("payment status")) {
    if (l.includes("unpaid")) return "border-red-200 bg-red-50";
    if (l.includes("partial") || l.includes("pending")) return "border-yellow-200 bg-yellow-50";
    if (l.includes("paid")) return "border-green-200 bg-green-50";
  }

  if (l.includes("unpaid") || l.includes("overdue")) return "border-red-200 bg-red-50";
  if (l.includes("partial") || l.includes("pending")) return "border-yellow-200 bg-yellow-50";
  if (l.includes("paid")) return "border-green-200 bg-green-50";

  return "bg-white";
}
