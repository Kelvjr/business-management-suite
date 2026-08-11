import type { Metadata } from "next";
import { SalesPageContent } from "@/components/sales/sales-page-content";

export const metadata: Metadata = { title: "Sales | Renaissance" };

export default function SalesPage() {
  return <SalesPageContent />;
}
