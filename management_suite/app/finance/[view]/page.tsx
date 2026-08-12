import { WorkspaceInsightPage } from "@/components/suite/workspace-insight-page";
import { PaymentsPageContent } from "@/components/finance/payments-page-content";

export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (view === "payments") return <PaymentsPageContent/>;
  return <WorkspaceInsightPage key={view} section="finance" view={view}/>;
}
