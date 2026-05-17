import { AppShell } from "@/components/layout/app-shell";
import { CustomersPageContent } from "@/components/customers/customers-page-content";
import { fetchCustomers, fetchSales } from "@/lib/api";

export default async function CustomersPage() {
  const [sales, customers] = await Promise.all([fetchSales(), fetchCustomers()]);

  return (
    <AppShell>
      <CustomersPageContent sales={sales} customers={customers} />
    </AppShell>
  );
}
