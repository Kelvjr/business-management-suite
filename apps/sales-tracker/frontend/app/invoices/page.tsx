import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchInvoices, fetchReceipts } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default async function InvoicesPage() {
  const [invoices, receipts] = await Promise.all([
    fetchInvoices().catch(() => []),
    fetchReceipts().catch(() => []),
  ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices & Receipts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review generated invoices, receipt confirmations, and printable totals.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Invoices" value={String(invoices.length)} />
          <MetricCard label="Receipts" value={String(receipts.length)} />
          <MetricCard
            label="Invoiced Total"
            value={formatCurrency(
              invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0),
            )}
          />
        </div>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-base">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Invoice</th>
                    <th className="py-3 pr-4">Customer</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {invoice.customerName || "Customer"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{invoice.paymentStatus}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {formatCurrency(Number(invoice.total))}
                      </td>
                    </tr>
                  ))}
                  {!invoices.length ? (
                    <tr>
                      <td className="py-8 text-sm text-muted-foreground" colSpan={5}>
                        No invoices generated yet.
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

