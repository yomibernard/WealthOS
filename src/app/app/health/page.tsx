import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
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
      <Panel>
        <p className="eyebrow">Overall</p>
        <p className="font-display mt-1 text-5xl">{dash.health.overall}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>/ 100</Badge>
          <Badge>Version {dash.health.version}</Badge>
          <Badge tone="warn">Coverage {Math.round(dash.health.coverage * 100)}%</Badge>
        </div>
      </Panel>
      <div className="mt-3 space-y-3">
        {dash.health.dimensions.map((d) => (
          <Link key={d.key} href={`/app/health/${d.key}`}>
            <Panel className="transition hover:border-accent">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{d.label}</p>
                <p className="font-display text-2xl">{d.score}</p>
              </div>
              <p className="muted mt-2 text-sm">{d.reason}</p>
            </Panel>
          </Link>
        ))}
      </div>
      <Panel className="mt-3">
        <p className="eyebrow">Improvement levers</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {dash.health.improvementLevers.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
      </Panel>
    </main>
  );
}
