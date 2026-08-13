import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard } from "@/services/wealth";

export default async function HealthDimensionPage({
  params,
}: {
  params: Promise<{ dimension: string }>;
}) {
  const { dimension } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");
  const dim = dash.health.dimensions.find((d) => d.key === dimension);
  if (!dim) redirect("/app/health");

  return (
    <main>
      <PageHeader title={dim.label} subtitle={`Weight ${(dim.weight * 100).toFixed(0)}% of overall score`} />
      <Panel>
        <p className="font-display text-5xl">{dim.score}</p>
        <p className="mt-3 leading-relaxed">{dim.reason}</p>
        <p className="muted mt-4 text-sm">
          Methodology version {dash.health.version}. Missing data reduces coverage confidence —
          currently {Math.round(dash.health.coverage * 100)}%.
        </p>
      </Panel>
    </main>
  );
}
