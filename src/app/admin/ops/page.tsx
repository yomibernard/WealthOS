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
        title="Ops board"
        subtitle="Live queues and care handoff first. Runbooks and commands stay collapsed until you need them."
      />

      <section className="hero-metric mb-4 space-y-4">
        <div>
          <p className="eyebrow">Needs your attention</p>
          <p className="muted mt-1 text-sm leading-relaxed">{nextSteps.summary}</p>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {nextSteps.items.slice(0, 3).map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="font-semibold text-accent hover:underline">
                {item.title}
              </Link>
              <p className="muted mt-1">{item.detail}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Link href={nextSteps.primaryHref} className="btn btn-primary">
            {nextSteps.items[0]?.kind === "do_nothing" ? "Open ops board" : "Take the next step"}
          </Link>
          <Link href="/admin/ai" className="btn btn-soft">
            Ask WealthAI
          </Link>
        </div>
      </section>

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">Daily ops board</p>
          <Badge tone={daily.attentionScore === 0 ? "default" : "warn"}>
            attention {daily.attentionScore}
          </Badge>
          <Badge tone={launch.ok ? "default" : "danger"}>
            {launch.ok ? "gate ok" : "gate blocked"}
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
                  <li key={r.id} className="flex flex-wrap items-baseline gap-2">
                    <span>
                      <span className="font-medium">{r.customerName}</span>
                      {" — "}
                      {r.adminName}
                      {r.notificationCreated ? " reminded linked adviser" : " remind attempted"}
                      <span className="muted">
                        {" · "}
                        {new Date(r.createdAt).toLocaleString("en-GB")}
                      </span>
                    </span>
                    {r.stale ? (
                      <Badge tone="warn">Awaiting answer 24h+</Badge>
                    ) : r.awaitingAnswer ? (
                      <Badge tone="warn">Awaiting answer</Badge>
                    ) : (
                      <Badge>Answered</Badge>
                    )}
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

      <details className="mb-3 rounded-[var(--radius)] border border-line bg-white px-4 py-3">
        <summary className="cursor-pointer font-semibold">
          Launch gate detail
          <span className="muted ml-2 text-sm font-normal">
            {launch.ok ? "all checks ok" : "review blockers"} · {launch.profile}
          </span>
        </summary>
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
      </details>

      <details className="mb-3 rounded-[var(--radius)] border border-line bg-white px-4 py-3">
        <summary className="cursor-pointer font-semibold">
          Cadence & collaboration modules
        </summary>
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
      </details>

      <details className="mb-3 rounded-[var(--radius)] border border-line bg-white px-4 py-3">
        <summary className="cursor-pointer font-semibold">Runbooks, commands & smoke</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="eyebrow">Documents</p>
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
          </div>
          <div>
            <p className="eyebrow">Commands</p>
            <ul className="mt-2 space-y-1 text-sm font-mono">
              <li>npm run release:check</li>
              <li>npm run launch:check</li>
              <li>npm run launch:rehearse-prod</li>
              <li>npm run launch:review</li>
              <li>npm run secrets:check</li>
              <li>npm run launch:local-a</li>
              <li>npm run ci:check</li>
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
          </div>
          <div className="md:col-span-2">
            <p className="eyebrow">Post-deploy smoke</p>
            <ol className="muted mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>
                Confirm Vercel env: Postgres <code>DATABASE_URL</code>, strong{" "}
                <code>SESSION_SECRET</code>, <code>DEMO_MODE=false</code>
              </li>
              <li>
                Open <code>/api/health</code> — expect <code>status: ok</code>,{" "}
                <code>databaseKind: postgres</code>
              </li>
              <li>
                Preflight <code className="font-mono text-ink">npm run smoke:hosted-ready</code>, then
                run{" "}
                <code className="font-mono text-ink">
                  SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:hosted
                </code>
              </li>
              <li>
                If host has no seed: add <code>SMOKE_SKIP_AUTH=1</code>; for shared pilot use{" "}
                <code>SMOKE_STRICT=1</code>
              </li>
            </ol>
          </div>
        </div>
      </details>

      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <Link href="/demo" className="btn btn-soft">
          Presenter demo
        </Link>
        <Link href="/api/health" className="btn btn-soft">
          Health
        </Link>
        <Link href="/admin/monitoring" className="btn btn-soft">
          AI monitoring
        </Link>
        <Link href="/admin/flags" className="btn btn-soft">
          Feature flags
        </Link>
      </div>
    </main>
  );
}
