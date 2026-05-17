import { formatCurrency, formatSaleDate } from "@/lib/format";
import type { Sale } from "@/lib/api";
import { PaymentStatusBadge } from "./payment-status-badge";
import { SaleRowActions } from "./sale-row-actions";

type SalesTableProps = {
  sales: Sale[];
};

export function SalesTable({ sales }: SalesTableProps) {
  if (!sales.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
        No sales found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="px-3 py-3 font-medium">Item</th>
            <th className="px-3 py-3 font-medium">Category</th>
            <th className="px-3 py-3 font-medium">Qty</th>
            <th className="px-3 py-3 font-medium">Price</th>
            <th className="px-3 py-3 font-medium">Total</th>
            <th className="px-3 py-3 font-medium">Customer</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Channel</th>
            <th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="border-b transition hover:bg-muted/50 last:border-0">
              <td className="px-3 py-3 font-medium">{sale.itemName}</td>
              <td className="px-3 py-3">{sale.category || "—"}</td>
              <td className="px-3 py-3">{sale.quantity ?? 1}</td>
              <td className="px-3 py-3">
                {formatCurrency(Number(sale.unitPrice ?? sale.totalAmount))}
              </td>
              <td className="px-3 py-3 font-medium">
                {formatCurrency(Number(sale.totalAmount))}
              </td>
              <td className="px-3 py-3">{sale.customerName || "Walk-in"}</td>
              <td className="px-3 py-3">
                <PaymentStatusBadge status={sale.paymentStatus} />
              </td>
              <td className="px-3 py-3 capitalize">{sale.salesChannel || "—"}</td>
              <td className="px-3 py-3">{formatSaleDate(sale.soldAt)}</td>
              <td className="px-3 py-3 text-right">
                <SaleRowActions sale={sale} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
