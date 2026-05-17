import { AppShell } from "@/components/layout/app-shell";
import { AddSalePageContent } from "@/components/sales/add-sale-page-content";
import { fetchSales } from "@/lib/api";

export default async function AddSalePage() {
  const sales = await fetchSales();

  return (
    <AppShell>
      <AddSalePageContent sales={sales} />
    </AppShell>
  );
}

