import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { evaluateLaunchGate } from "@/lib/launch-gate";
import { loadOpsDailyBoard } from "@/services/ops-daily";
import { loadOpsNextStepsPulse } from "@/services/ops-next-steps";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADMIN") redirect("/app");

  const [customers, products, audits, providers, daily, nextSteps, launch] =
    await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.auditEvent.count(),
      prisma.provider.count(),
      loadOpsDailyBoard(),
      loadOpsNextStepsPulse(),
      Promise.resolve(evaluateLaunchGate()),
    ]);

  const commandTiles = [
    {
      href: "/admin/ops",
      label: "Critical / attention",
      value: daily.attentionScore,
      detail: daily.attentionScore === 0 ? "Board clear" : "Score from live queues",
      tone: daily.attentionScore === 0 ? ("default" as const) : ("warn" as const),
    },
    {
      href: "/admin/escalations",
      label: "Open escalations",
      value: daily.counts.openEscalations,
      detail:
        daily.counts.openComplaints > 0
          ? `${daily.counts.openComplaints} complaint(s)`
          : "Support + complaints",
      tone:
        daily.counts.openComplaints > 0
          ? ("danger" as const)
          : daily.counts.openEscalations > 0
            ? ("warn" as const)
            : ("default" as const),
    },
    {
      href: "/admin/privacy",
      label: "Privacy requests",
      value: daily.counts.openPrivacy,
      detail: "Access · correction · erasure",
      tone: daily.counts.openPrivacy > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/admin/change-requests",
      label: "Checker pending",
      value: daily.counts.pendingChangeRequests,
      detail: "Maker-checker dual control",
      tone:
        daily.counts.pendingChangeRequests > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/admin/monitoring",
      label: "System / AI health",
      value: launch.ok ? "OK" : "Blocked",
      detail: launch.ok ? `Gate ${launch.profile}` : "Review launch gate",
      tone: launch.ok ? ("default" as const) : ("danger" as const),
    },
    {
      href: "/admin/ops#care-handoff",
      label: "Care unacked",
      value: daily.counts.unackedCareCustomers,
      detail: "Does not close admin queues",
      tone: daily.counts.unackedCareCustomers > 0 ? ("warn" as const) : ("default" as const),
    },
  ];

  return (
    <main className="page-wide">
      <PageHeader
        title="Operations command centre"
        subtitle="Queues, dual-control, and launch health — not a consumer dashboard."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/ops" className="btn btn-primary">
              Ops board
            </Link>
            <Link href="/admin/ai" className="btn btn-soft">
              Ask WealthAI
            </Link>
          </div>
        }
      />

      <InsightPanel eyebrow="Ops posture">
        Care acknowledgments and customer “seen” receipts never close escalations or privacy
        requests. Checker approvals stay dual-control.
      </InsightPanel>

      <section className="hero-metric mt-4 space-y-4">
        <div>
          <p className="eyebrow">Needs your attention</p>
          <p className="muted mt-1 text-sm leading-relaxed">{nextSteps.summary}</p>
        </div>
        {nextSteps.headline ? (
          <Link
            href={nextSteps.primaryHref}
            className="inline-block font-display text-2xl font-semibold text-accent hover:underline"
          >
            {nextSteps.headline}
          </Link>
        ) : null}
        {nextSteps.items.length > 1 ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {nextSteps.items.slice(1, 4).map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="font-semibold text-accent hover:underline">
                  {item.title}
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href={nextSteps.primaryHref} className="btn btn-primary">
            {nextSteps.items[0]?.kind === "do_nothing" ? "Open ops board" : "Take the next step"}
          </Link>
          <Link href="/admin/ai" className="btn btn-soft">
            Ask WealthAI
          </Link>
          <Link href="/admin/ops" className="btn btn-ghost">
            Full ops board
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <p className="eyebrow">Command strip</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {commandTiles.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-xl border border-line bg-white px-4 py-4 transition hover:border-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="muted text-xs font-semibold uppercase tracking-wide">{tile.label}</p>
                <Badge tone={tile.tone}>Open</Badge>
              </div>
              <p className="mt-2 font-display text-3xl">{tile.value}</p>
              <p className="muted mt-1 text-sm">{tile.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <p className="eyebrow">Fleet snapshot</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Panel>
            <p className="eyebrow">Customers</p>
            <p className="font-display text-3xl">{customers}</p>
          </Panel>
          <Panel>
            <p className="eyebrow">Products</p>
            <p className="font-display text-3xl">{products}</p>
          </Panel>
          <Panel>
            <p className="eyebrow">Providers</p>
            <p className="font-display text-3xl">{providers}</p>
          </Panel>
          <Panel>
            <p className="eyebrow">Audit events</p>
            <p className="font-display text-3xl">{audits}</p>
          </Panel>
        </div>
      </section>

      <section className="mt-6">
        <p className="eyebrow">Next-step queues & tools</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[
            {
              href: "/admin/ops",
              title: "Ops board",
              body: "Live queues, care handoff, launch gate.",
            },
            {
              href: "/admin/escalations",
              title: "Escalations & complaints",
              body: "Route Level 2–5 cases with care-ack cues.",
            },
            {
              href: "/admin/privacy",
              title: "Privacy requests",
              body: "Access, rectification, objection and erasure.",
            },
            {
              href: "/admin/change-requests",
              title: "Maker-checker queue",
              body: "Second admin reviews high-risk changes.",
            },
            {
              href: "/admin/monitoring",
              title: "AI & model monitoring",
              body: "Groundedness, escalations, acceptance, WealthGuard.",
            },
            {
              href: "/admin/audit",
              title: "Audit timeline",
              body: "Readable events; JSON download secondary.",
            },
            {
              href: "/admin/flags",
              title: "Feature flags & profiles",
              body: "Safe pilot / incident lockdown env snippets.",
            },
            {
              href: "/admin/products",
              title: "Product catalogue",
              body: "Propose approve / suspend — checker must confirm.",
            },
            {
              href: "/admin/fx",
              title: "FX rates",
              body: "Refresh approved FX source used by net worth.",
            },
            {
              href: "/admin/rules",
              title: "Suitability & health config",
              body: "Versioned methodology reference.",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Panel className="h-full transition hover:border-accent">
                <p className="font-semibold">{item.title}</p>
                <p className="muted text-sm">{item.body}</p>
              </Panel>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
