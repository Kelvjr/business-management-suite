import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchProfitSummary, fetchProfitTrend } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default async function ProfitPage() {
  const [summary, trend] = await Promise.all([
    fetchProfitSummary().catch(() => ({
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      grossProfit: 0,
      profitMarginPercent: 0,
      salesCount: 0,
      expenseCount: 0,
    })),
    fetchProfitTrend({ period: "monthly" }).catch(() => []),
  ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare revenue against expenses and monitor business margin.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Revenue" value={formatCurrency(summary.totalRevenue)} />
          <MetricCard label="Expenses" value={formatCurrency(summary.totalExpenses)} />
          <MetricCard label="Net Profit" value={formatCurrency(summary.netProfit)} />
          <MetricCard label="Margin" value={`${summary.profitMarginPercent.toFixed(2)}%`} />
        </div>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-base">Monthly Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Period</th>
                    <th className="py-3 pr-4 text-right">Revenue</th>
                    <th className="py-3 pr-4 text-right">Expenses</th>
                    <th className="py-3 pr-4 text-right">Profit</th>
                    <th className="py-3 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((point) => (
                    <tr key={point.period} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{point.period}</td>
                      <td className="py-3 pr-4 text-right">
                        {formatCurrency(point.revenue)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {formatCurrency(point.expenses)}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold">
                        {formatCurrency(point.profit)}
                      </td>
                      <td className="py-3 text-right">{point.margin.toFixed(2)}%</td>
                    </tr>
                  ))}
                  {!trend.length ? (
                    <tr>
                      <td className="py-8 text-sm text-muted-foreground" colSpan={5}>
                        No profit trend data yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="premium-card">
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

