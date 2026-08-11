import { WorkspaceInsightPage } from "@/components/suite/workspace-insight-page";

export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  return <WorkspaceInsightPage key={view} section="finance" view={view}/>;
}
