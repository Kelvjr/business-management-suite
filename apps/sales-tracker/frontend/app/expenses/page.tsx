import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchExpenseSummary, fetchExpenses } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default async function ExpensesPage() {
  const [expenses, summary] = await Promise.all([
    fetchExpenses().catch(() => []),
    fetchExpenseSummary().catch(() => ({
      totalExpenses: 0,
      expenseCount: 0,
      recurringExpenses: 0,
      recurringCount: 0,
      byCategory: [],
    })),
  ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track operating costs, recurring spend, vendors, and category totals.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} />
          <MetricCard label="Expense Records" value={String(summary.expenseCount)} />
          <MetricCard label="Recurring Spend" value={formatCurrency(summary.recurringExpenses)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-base">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Vendor</th>
                      <th className="py-3 pr-4">Type</th>
                      <th className="py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4 font-medium">{expense.category}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {expense.vendor || "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">
                            {expense.recurring ? "Recurring" : "Manual"}
                          </Badge>
                        </td>
                        <td className="py-3 text-right font-semibold">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                      </tr>
                    ))}
                    {!expenses.length ? (
                      <tr>
                        <td className="py-8 text-sm text-muted-foreground" colSpan={5}>
                          No expenses recorded yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-base">By Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.byCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.category}</p>
                    <p className="text-xs text-muted-foreground">{item.count} records</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.total)}</p>
                </div>
              ))}
              {!summary.byCategory.length ? (
                <p className="text-sm text-muted-foreground">No category data yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
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

