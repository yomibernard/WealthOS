import Link from "next/link";
import { redirect } from "next/navigation";
import { InsightPanel, PageHeader, Panel } from "@/components/ui";
import { HealthRing } from "@/components/charts/HealthRing";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard } from "@/services/wealth";
import { healthBand, healthShortLabel } from "@/engines/wealth-visuals";

export default async function HealthPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const band = healthBand(dash.health.overall);
  const sorted = [...dash.health.dimensions].sort((a, b) => a.score - b.score);

  return (
    <main>
      <PageHeader
        title="Wealth Health"
        subtitle="Diagnosis first — strengthen dimensions before chasing products."
      />

      <HealthRing
        overall={dash.health.overall}
        version={dash.health.version}
        coveragePct={Math.round(dash.health.coverage * 100)}
        dimensions={dash.health.dimensions.map((d) => ({
          key: d.key,
          label: d.label,
          score: d.score,
          reason: d.reason,
        }))}
      />

      <InsightPanel className="mt-4" eyebrow="Status">
        {healthShortLabel(dash.health.overall)} · {band.title}. Coverage{" "}
        {Math.round(dash.health.coverage * 100)}%. Low scores are signals to strengthen — never to
        shame.
      </InsightPanel>

      <Panel className="mt-3">
        <p className="eyebrow">Improvement levers</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          {dash.health.improvementLevers.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
        <Link href="/app/actions" className="btn btn-soft mt-4 inline-flex">
          Review recommended actions
        </Link>
      </Panel>

      <section className="mt-5">
        <h2 className="font-display text-xl">Eight dimensions</h2>
        <p className="muted mt-1 text-sm">Open any dimension for why it matters and what good looks like.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {sorted.map((d) => (
            <li key={d.key}>
              <Link href={`/app/health/${d.key}`} className="wealth-dim-link">
                <span>
                  <span className="font-semibold">{d.label}</span>
                  <span className="muted mt-0.5 block text-xs line-clamp-2">{d.reason}</span>
                </span>
                <span className="font-display text-2xl tabular-nums">{d.score}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
