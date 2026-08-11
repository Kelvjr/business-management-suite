import type { Metadata } from "next";
import { WorkspaceInsightPage } from "@/components/suite/workspace-insight-page";

export const metadata: Metadata = { title: "Alerts | Renaissance" };
export default function Page() { return <WorkspaceInsightPage section="overview" view="alerts"/>; }
