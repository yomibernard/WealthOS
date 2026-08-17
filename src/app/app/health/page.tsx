import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { HealthRing } from "@/components/charts/HealthRing";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard } from "@/services/wealth";

export default async function HealthPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  return (
    <main>
      <PageHeader
        title="Wealth Health"
        subtitle="A governed score with explanations — no peer ranking or wealth shaming."
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

      <Panel className="mt-3">
        <p className="eyebrow">Improvement levers</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          {dash.health.improvementLevers.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
      </Panel>
    </main>
  );
}
