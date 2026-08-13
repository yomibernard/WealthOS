import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { evaluateLaunchGate } from "@/lib/launch-gate";
import { getFeatureFlags } from "@/lib/feature-flags";

const moduleIndex = [
  { href: "/app/reports", label: "Monthly reports", flag: "monthlyReports" as const },
  { href: "/app/digest", label: "Weekly digest", flag: "weeklyDigest" as const },
  { href: "/app/plan/funding", label: "Goal funding pulse", flag: null },
  { href: "/app/wealth/confidence", label: "Data confidence", flag: null },
  { href: "/app/profile", label: "Profile completeness", flag: null },
  { href: "/app/notifications", label: "Notification prefs", flag: null },
  { href: "/app/adviser-collab", label: "Adviser collab / share", flag: "adviserCollab" as const },
  { href: "/adviser", label: "Adviser portal + nudges", flag: "adviserCollab" as const },
];

export default async function AdminOpsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");

  const launch = evaluateLaunchGate();
  const flags = getFeatureFlags();

  return (
    <main className="page-wide">
      <PageHeader
        title="Ops & launch"
        subtitle="Runbooks, launch gate, cadence modules, and presenter tools — freeze before public traffic."
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={launch.ok ? "default" : "danger"}>
            {launch.ok ? "gate ok" : "gate blocked"}
          </Badge>
          <Badge>{launch.profile}</Badge>
          <Badge>v0.1.0</Badge>
        </div>
        <p className="muted mt-2 text-sm">
          Checked {new Date(launch.checkedAt).toLocaleString("en-GB")}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {launch.checks.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start justify-between gap-2">
              <span>
                <span className="font-medium">{c.id}</span> — {c.message}
              </span>
              <Badge tone={c.ok ? "default" : c.severity === "blocker" ? "danger" : "warn"}>
                {c.ok ? "ok" : c.severity}
              </Badge>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-4">
        <p className="font-semibold">Cadence & collaboration modules</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {moduleIndex.map((m) => {
            const on = m.flag ? flags[m.flag] : true;
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm hover:bg-accent-soft/40"
                >
                  <span>{m.label}</span>
                  <Badge tone={on ? "default" : "warn"}>{on ? "on" : "flag off"}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Panel>
          <p className="font-semibold">Documents</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <code>OPS_RUNBOOK.md</code> — release, incident, support
            </li>
            <li>
              <code>LAUNCH_REVIEW.md</code> — freeze checklist
            </li>
            <li>
              <code>DEMO_SCRIPT.md</code> — full narrative script (Acts 1–5)
            </li>
            <li>
              <code>DEPLOY.md</code> — Vercel + Postgres pilot
            </li>
            <li>
              <code>POSTGRES_CUTOVER.md</code> — production DB path
            </li>
            <li>
              <code>MVP_STATUS.md</code> — module readiness freeze
            </li>
          </ul>
        </Panel>
        <Panel>
          <p className="font-semibold">Commands</p>
          <ul className="mt-2 space-y-1 text-sm font-mono">
            <li>npm run release:check</li>
            <li>npm run launch:check</li>
            <li>LAUNCH_PROFILE=production npm run launch:check</li>
            <li>npm run db:postgres-ready</li>
            <li>npm run db:rehearse-postgres</li>
            <li>npm run smoke</li>
            <li>npm run perf:check</li>
            <li>npm run build:vercel</li>
          </ul>
        </Panel>
        <Link href="/demo">
          <Panel>
            <p className="font-semibold">Presenter demo checklist</p>
            <p className="muted text-sm">Timed acts + cast + jump links</p>
          </Panel>
        </Link>
        <Link href="/api/health">
          <Panel>
            <p className="font-semibold">Health endpoint</p>
            <p className="muted text-sm">JSON status for uptime probes</p>
          </Panel>
        </Link>
        <Link href="/admin/monitoring">
          <Panel>
            <p className="font-semibold">AI monitoring</p>
            <p className="muted text-sm">Groundedness and escalation signals</p>
          </Panel>
        </Link>
        <Link href="/admin/flags">
          <Panel>
            <p className="font-semibold">Feature flags</p>
            <p className="muted text-sm">Kill switches during incidents</p>
          </Panel>
        </Link>
      </div>
    </main>
  );
}
