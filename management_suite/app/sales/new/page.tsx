import type { Metadata } from "next";
import { RecordSalePageContent } from "@/components/sales/record-sale-page-content";

export const metadata: Metadata = { title: "Record sale | Renaissance" };

export default function RecordSalePage() {
  return <RecordSalePageContent />;
}
