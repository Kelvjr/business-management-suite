import { AppShell } from "@/components/layout/app-shell";
import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { fetchCustomers, fetchSales } from "@/lib/api";
import { buildDashboardSignals } from "@/lib/domain/dashboard-signals";

export default async function HomePage() {
  let customers: Awaited<ReturnType<typeof fetchCustomers>> = [];
  const [sales, customerList] = await Promise.all([
    fetchSales(),
    fetchCustomers().catch(() => [] as Awaited<ReturnType<typeof fetchCustomers>>),
  ]);
  customers = customerList;

  const signals = buildDashboardSignals(sales);

  return (
    <AppShell>
      <DashboardPageContent
        sales={sales}
        customers={customers}
        signals={signals}
        userFirstName="Kelvin"
      />
    </AppShell>
  );
}
