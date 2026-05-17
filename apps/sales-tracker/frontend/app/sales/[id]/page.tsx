import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteSaleButton } from "@/components/sales/delete-sale-button";
import { formatCurrency } from "@/lib/format";
import { EditSaleSheet } from "@/components/sales/edit-sale-sheet";
import { PaymentStatusBadge } from "@/components/sales/payment-status-badge";
import { fetchSaleById } from "@/lib/api";

export default async function SaleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await fetchSaleById(id);

  if (!sale) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Sale Details
            </h1>
            <p className="text-sm text-muted-foreground">
              View the full details of this sales record.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <EditSaleSheet
              sale={sale}
              trigger={
                <Button type="button" variant="default">
                  Edit Sale
                </Button>
              }
            />
            <DeleteSaleButton
              id={sale.id}
              trigger={
                <Button type="button" variant="destructive">
                  Delete
                </Button>
              }
            />
            <Button asChild variant="outline">
              <Link href="/sales">Back to Sales</Link>
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>{sale.itemName}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label="Item Type" value={sale.itemType} />
            <Detail label="Category" value={sale.category || "—"} />
            <Detail label="Subcategory" value={sale.subcategory || "—"} />
            <Detail label="Customer" value={sale.customerName || "Walk-in"} />
            <Detail label="Quantity" value={String(sale.quantity ?? 1)} />
            <Detail
              label="Unit Price"
              value={formatCurrency(
                Number(sale.unitPrice ?? sale.totalAmount),
              )}
            />
            <Detail
              label="Total Amount"
              value={formatCurrency(Number(sale.totalAmount))}
            />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <PaymentStatusBadge status={sale.paymentStatus} />
            </div>
            <Detail label="Sales Channel" value={sale.salesChannel || "—"} />
            <Detail
              label="Sold At"
              value={new Date(sale.soldAt).toLocaleString()}
            />
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{sale.notes || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
