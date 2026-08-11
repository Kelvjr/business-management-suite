import type { Metadata } from "next";
import { SaleDetailContent } from "@/components/sales/sale-detail-content";

export const metadata: Metadata = { title: "Sale details | Renaissance" };

export default function SaleDetailPage() {
  return <SaleDetailContent />;
}
