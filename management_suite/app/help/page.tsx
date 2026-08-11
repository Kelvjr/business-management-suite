import type { Metadata } from "next";
import { HelpPageContent } from "@/components/help/help-page-content";

export const metadata: Metadata = { title: "Help & support | Renaissance" };

export default function HelpPage() {
  return <HelpPageContent />;
}
