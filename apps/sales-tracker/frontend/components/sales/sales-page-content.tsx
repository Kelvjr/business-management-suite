import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Sale } from "@/lib/api";
import { DashboardSalesSummary } from "@/components/dashboard/dashboard-sales-summary";
import { RecentSales } from "@/components/dashboard/recent-sales";

type SalesPageContentProps = {
  sales: Sale[];
};

export function SalesPageContent({ sales }: SalesPageContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">
            View, filter, and manage all sales records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/sales/categories">Categories</Link>
          </Button>
          <Button asChild>
            <Link href="/sales/add">New Sale</Link>
          </Button>
        </div>
      </div>

      <Card className="premium-card">
        <CardContent className="pt-3">
          <DashboardSalesSummary sales={sales} embedded />
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Sales Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecentSales sales={sales} pageSize={10} />
        </CardContent>
      </Card>
    </div>
  );
}
