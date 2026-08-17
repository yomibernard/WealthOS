import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionCard, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard } from "@/services/wealth";
import { getDimensionGuidance } from "@/lib/health-dimension-guidance";
import { healthShortLabel } from "@/engines/wealth-visuals";

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

  const guidance = getDimensionGuidance(dim.key);
  const status = healthShortLabel(dim.score);

  return (
    <main>
      <PageHeader
        title={dim.label}
        subtitle={`${status} · weight ${(dim.weight * 100).toFixed(0)}% of overall Wealth Health`}
      />

      <Panel>
        <p className="eyebrow">Current position</p>
        <p className="font-display mt-1 text-5xl tabular-nums">{dim.score}</p>
        <p className="muted mt-2 text-sm">
          Overall Wealth Health {dash.health.overall}/100 · coverage{" "}
          {Math.round(dash.health.coverage * 100)}%
        </p>
      </Panel>

      <InsightPanel className="mt-4" eyebrow="Why this matters">
        {guidance.whyMatters}
      </InsightPanel>

      <Panel className="mt-3">
        <p className="eyebrow">What is affecting the score</p>
        <p className="mt-2 leading-relaxed">{dim.reason}</p>
        <p className="muted mt-3 text-sm">
          Methodology {dash.health.version}. Missing data reduces coverage confidence — never
          invents a stronger score.
        </p>
      </Panel>

      <Panel className="mt-3">
        <p className="eyebrow">What good looks like</p>
        <p className="mt-2 leading-relaxed">{guidance.whatGoodLooksLike}</p>
      </Panel>

      <ActionCard className="mt-3">
        <p className="eyebrow">Recommended actions</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          {guidance.recommendedActions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/app/actions" className="btn btn-accent">
            Open recommendations
          </Link>
          <Link href="/app/health" className="btn btn-ghost">
            Back to Wealth Health
          </Link>
        </div>
      </ActionCard>

      <Panel className="mt-3">
        <p className="eyebrow">Historical trend</p>
        <p className="muted mt-2 text-sm leading-relaxed">
          Dimension-level history is not stored as a separate series yet. Use overall Wealth Health
          and net-worth snapshots for directional change — we will not fabricate a trend line.
        </p>
        <Link href="/app/wealth/net-worth" className="mt-3 inline-block text-sm font-semibold text-accent">
          View net-worth history
        </Link>
      </Panel>
    </main>
  );
}
