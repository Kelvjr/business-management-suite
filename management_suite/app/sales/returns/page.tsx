import type { Metadata } from "next";
import { WorkspaceInsightPage } from "@/components/suite/workspace-insight-page";

export const metadata: Metadata = { title: "Returns & refunds | Renaissance" };
export default function Page() { return <WorkspaceInsightPage section="sales" view="returns"/>; }
