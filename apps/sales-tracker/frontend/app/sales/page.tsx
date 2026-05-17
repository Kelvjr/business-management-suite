import { AppShell } from "@/components/layout/app-shell";
import { SalesPageContent } from "@/components/sales/sales-page-content";
import { fetchSales } from "@/lib/api";

type SalesPageProps = {
  searchParams: Promise<{
    category?: string;
    paymentStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = await searchParams;

  const sales = await fetchSales({
    category: params.category,
    paymentStatus: params.paymentStatus,
    search: params.search,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  return (
    <AppShell>
      <SalesPageContent sales={sales} />
    </AppShell>
  );
}
