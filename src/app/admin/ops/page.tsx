import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { evaluateLaunchGate } from "@/lib/launch-gate";
import { getFeatureFlags } from "@/lib/feature-flags";
import { loadOpsDailyBoard } from "@/services/ops-daily";
import { loadOpsNextStepsPulse } from "@/services/ops-next-steps";
import { OpsCareRemindButton } from "@/components/OpsCareRemindButton";

const moduleIndex = [
  { href: "/app/reports", label: "Monthly reports", flag: "monthlyReports" as const },
  { href: "/app/digest", label: "Weekly digest", flag: "weeklyDigest" as const },
  { href: "/app/plan/funding", label: "Goal funding pulse", flag: null },
  { href: "/app/wealth/confidence", label: "Data confidence", flag: null },
  { href: "/app/profile", label: "Profile completeness", flag: null },
  { href: "/app/notifications", label: "Notification prefs", flag: null },
  { href: "/app/adviser-collab", label: "Adviser collab / share", flag: "adviserCollab" as const },
  { href: "/adviser", label: "Adviser portal + nudges", flag: "adviserCollab" as const },
  { href: "/app/privacy", label: "Privacy export", flag: null },
  { href: "/app/support", label: "Support & complaints", flag: null },
  { href: "/admin/escalations", label: "Admin escalations queue", flag: null },
  { href: "/admin/audit", label: "Audit export", flag: null },
];

export default async function AdminOpsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");

  const launch = evaluateLaunchGate();
  const flags = getFeatureFlags();
  const [daily, nextSteps] = await Promise.all([
    loadOpsDailyBoard(),
    loadOpsNextStepsPulse(),
  ]);

  return (
    <main className="page-wide">
      <PageHeader
        title="Ops & launch"
        subtitle="Daily ops board, runbooks, launch gate, and presenter tools — freeze before public traffic."
      />

      <Panel className="mb-4">
        <p className="eyebrow">Needs your attention</p>
        <p className="muted mt-1 text-sm">{nextSteps.summary}</p>
        <ol className="mt-3 list-decimal space-y-3 pl-5">
          {nextSteps.items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="font-semibold text-accent hover:underline">
                {item.title}
              </Link>
              <p className="muted mt-1 text-sm">{item.detail}</p>
            </li>
          ))}
        </ol>
        <Link href={nextSteps.primaryHref} className="btn btn-primary mt-4 w-full sm:w-auto">
          {nextSteps.items[0]?.kind === "do_nothing" ? "Open ops board" : "Take the next step"}
        </Link>
        <Link href="/admin/ai" className="btn btn-soft mt-2 w-full sm:w-auto sm:ml-2">
          Ask WealthAI what to do next
        </Link>
      </Panel>

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">Daily ops board</p>
          <Badge tone={daily.attentionScore === 0 ? "default" : "warn"}>
            attention {daily.attentionScore}
          </Badge>
        </div>
        <p className="muted mt-1 text-sm">{daily.summary}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {daily.queues.map((q) => (
            <li key={q.id}>
              <Link
                href={q.href}
                className="block rounded-xl border border-line px-3 py-2 hover:bg-accent-soft/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{q.label}</span>
                  <Badge
                    tone={
                      q.tone === "danger" ? "danger" : q.tone === "warn" ? "warn" : "default"
                    }
                  >
                    {q.count}
                  </Badge>
                </div>
                <p className="muted mt-1 text-xs">{q.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
        {daily.topComplaints.length ? (
          <div className="mt-3">
            <p className="eyebrow">Top open complaints</p>
            <ul className="mt-1 space-y-1 text-sm">
              {daily.topComplaints.map((c) => (
                <li key={c.id}>
                  <Link href="/admin/escalations" className="text-accent hover:underline">
                    {c.customerName}
                  </Link>
                  {" — "}
                  {c.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Care handoff</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={daily.careHandoff.unackedCareCustomers > 0 ? "warn" : "default"}>
                {daily.careHandoff.unackedCareCustomers} unacked
              </Badge>
              <Badge tone={daily.careHandoff.awaitingReceiptCount > 0 ? "warn" : "default"}>
                {daily.careHandoff.awaitingReceiptCount} awaiting receipt
              </Badge>
            </div>
          </div>
          <p className="muted mt-1 text-sm">{daily.careHandoff.summary}</p>
          {daily.careHandoff.recentAcks.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {daily.careHandoff.recentAcks.map((a) => (
                <li key={a.id}>
                  <span className="font-medium">{a.customerName}</span>
                  {" — "}
                  {a.adviserName}: {a.title}
                  <span className="muted">
                    {" · "}
                    {new Date(a.createdAt).toLocaleString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {daily.careHandoff.recentReceipts.length ? (
            <div className="mt-2 space-y-1">
              <p className="muted text-xs font-semibold uppercase tracking-wide">
                Recent customer receipts
              </p>
              <ul className="space-y-1 text-sm">
                {daily.careHandoff.recentReceipts.map((r) => (
                  <li key={r.id}>
                    <span className="font-medium">{r.customerName}</span>
                    {" seen · "}
                    {r.adviserName}
                    {r.thanksPreview ? ` — “${r.thanksPreview}”` : ""}
                    <span className="muted">
                      {" · "}
                      {new Date(r.seenAt).toLocaleString("en-GB")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {daily.careHandoff.recentReminds.length ? (
            <div className="mt-2 space-y-1">
              <p className="muted text-xs font-semibold uppercase tracking-wide">
                Recent ops reminds
              </p>
              <ul className="space-y-1 text-sm">
                {daily.careHandoff.recentReminds.map((r) => (
                  <li key={r.id}>
                    <span className="font-medium">{r.customerName}</span>
                    {" — "}
                    {r.adminName}
                    {r.notificationCreated ? " reminded linked adviser" : " remind attempted"}
                    <span className="muted">
                      {" · "}
                      {new Date(r.createdAt).toLocaleString("en-GB")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {daily.careHandoff.recentRemindAnswers.length ? (
            <div className="mt-2 space-y-1">
              <p className="muted text-xs font-semibold uppercase tracking-wide">
                Recent remind answers
              </p>
              <ul className="space-y-1 text-sm">
                {daily.careHandoff.recentRemindAnswers.map((r) => (
                  <li key={r.id}>
                    <span className="font-medium">{r.customerName}</span>
                    {" — "}
                    {r.adviserName} answered ops remind
                    <span className="muted">
                      {" · "}
                      {new Date(r.answeredAt).toLocaleString("en-GB")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-accent">
            <Link href="/admin/escalations">Remind from escalations</Link>
            <Link href="/adviser?care=unacked">Open unacked care radar</Link>
            <Link href="/adviser?care=ops_reminded">Open ops-reminded radar</Link>
            <Link href="/adviser?care=awaiting">Open awaiting receipt</Link>
          </div>
          <OpsCareRemindButton unackedCount={daily.careHandoff.unackedCareCustomers} />
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={launch.ok ? "default" : "danger"}>
            {launch.ok ? "gate ok" : "gate blocked"}
          </Badge>
          <Badge>{launch.profile}</Badge>
          <Badge>v{process.env.npm_package_version ?? "0.1.4"}</Badge>
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
            <li>npm run launch:rehearse-prod</li>
            <li>npm run launch:review</li>
            <li>npm run secrets:check</li>
            <li>LAUNCH_PROFILE=production npm run launch:check</li>
            <li>npm run db:postgres-ready</li>
            <li>npm run db:rehearse-postgres</li>
            <li>npm run smoke</li>
            <li>npm run smoke:hosted-ready</li>
            <li>SMOKE_BASE_URL=https://… npm run smoke:hosted</li>
            <li>npm run pilot:freeze</li>
            <li>npm run perf:check</li>
            <li>npm run build:vercel</li>
          </ul>
        </Panel>
        <Panel>
          <p className="font-semibold">Post-deploy smoke (Phase 8.2)</p>
          <ol className="muted mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>Confirm Vercel env: Postgres <code>DATABASE_URL</code>, strong <code>SESSION_SECRET</code>, <code>DEMO_MODE=false</code></li>
            <li>Open <code>/api/health</code> — expect <code>status: ok</code>, <code>databaseKind: postgres</code></li>
            <li>
              Preflight <code className="font-mono text-ink">npm run smoke:hosted-ready</code>, then run{" "}
              <code className="font-mono text-ink">
                SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:hosted
              </code>
            </li>
            <li>If host has no seed: add <code>SMOKE_SKIP_AUTH=1</code>; for shared pilot use <code>SMOKE_STRICT=1</code></li>
          </ol>
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
            <p className="muted text-sm">DB + demoMode + databaseKind (no secrets)</p>
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
