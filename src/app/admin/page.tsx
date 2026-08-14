import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadOpsDailyBoard } from "@/services/ops-daily";
import { loadOpsNextStepsPulse } from "@/services/ops-next-steps";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADMIN") redirect("/app");

  const [customers, products, audits, providers, daily, nextSteps] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.auditEvent.count(),
    prisma.provider.count(),
    loadOpsDailyBoard(),
    loadOpsNextStepsPulse(),
  ]);

  return (
    <main className="page-wide">
      <PageHeader
        title="Admin portal"
        subtitle="Operations with dual-control maker-checker for high-risk changes."
      />
      <Panel className="mb-4">
        <p className="eyebrow">Needs your attention</p>
        <p className="muted mt-1 text-sm">{nextSteps.summary}</p>
        {nextSteps.headline ? (
          <Link
            href={nextSteps.primaryHref}
            className="mt-2 inline-block font-semibold text-accent hover:underline"
          >
            {nextSteps.headline}
          </Link>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={daily.attentionScore === 0 ? "default" : "warn"}>
            attention {daily.attentionScore}
          </Badge>
          {daily.counts.unackedCareCustomers > 0 ? (
            <Badge tone="warn">{daily.counts.unackedCareCustomers} care unacked</Badge>
          ) : null}
          <Link href={nextSteps.primaryHref} className="btn btn-primary text-sm">
            {nextSteps.items[0]?.kind === "do_nothing" ? "Open ops board" : "Take the next step"}
          </Link>
          <Link href="/admin/ai" className="btn btn-soft text-sm">
            Ask WealthAI
          </Link>
          <Link href="/admin/ops" className="btn btn-soft text-sm">
            Full ops board
          </Link>
        </div>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <Link href="/admin/escalations">
          <Panel className="h-full transition hover:border-accent">
            <p className="eyebrow">Open escalations</p>
            <p className="font-display text-3xl">{daily.counts.openEscalations}</p>
            {daily.counts.openComplaints > 0 ? (
              <p className="muted mt-1 text-xs">{daily.counts.openComplaints} complaint(s)</p>
            ) : null}
          </Panel>
        </Link>
        <Link href="/admin/privacy">
          <Panel className="h-full transition hover:border-accent">
            <p className="eyebrow">Privacy open</p>
            <p className="font-display text-3xl">{daily.counts.openPrivacy}</p>
          </Panel>
        </Link>
        <Link href="/admin/change-requests">
          <Panel className="h-full transition hover:border-accent">
            <p className="eyebrow">Checker pending</p>
            <p className="font-display text-3xl">{daily.counts.pendingChangeRequests}</p>
          </Panel>
        </Link>
        <Panel>
          <p className="eyebrow">Audit events</p>
          <p className="font-display text-3xl">{audits}</p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Link href="/admin/products">
          <Panel>
            <p className="font-semibold">Product catalogue</p>
            <p className="muted text-sm">Propose approve / suspend — checker must confirm.</p>
          </Panel>
        </Link>
        <Link href="/admin/change-requests">
          <Panel>
            <p className="font-semibold">Maker-checker queue</p>
            <p className="muted text-sm">Second admin reviews high-risk changes.</p>
          </Panel>
        </Link>
        <Link href="/admin/fx">
          <Panel>
            <p className="font-semibold">FX rates</p>
            <p className="muted text-sm">Refresh approved FX source used by net worth.</p>
          </Panel>
        </Link>
        <Link href="/admin/monitoring">
          <Panel>
            <p className="font-semibold">AI & model monitoring</p>
            <p className="muted text-sm">Groundedness, escalations, acceptance, WealthGuard.</p>
          </Panel>
        </Link>
        <Link href="/admin/escalations">
          <Panel>
            <p className="font-semibold">Escalations & complaints</p>
            <p className="muted text-sm">Route Level 2–5 cases.</p>
          </Panel>
        </Link>
        <Link href="/admin/audit">
          <Panel>
            <p className="font-semibold">Audit logs & export</p>
            <p className="muted text-sm">Filter by category; download redacted JSON pack.</p>
          </Panel>
        </Link>
        <Link href="/admin/rules">
          <Panel>
            <p className="font-semibold">Suitability & health config</p>
            <p className="muted text-sm">Versioned methodology reference.</p>
          </Panel>
        </Link>
        <Link href="/admin/privacy">
          <Panel>
            <p className="font-semibold">Privacy requests</p>
            <p className="muted text-sm">Access, rectification, objection and erasure queue.</p>
          </Panel>
        </Link>
        <Link href="/admin/flags">
          <Panel>
            <p className="font-semibold">Feature flags & profiles</p>
            <p className="muted text-sm">Safe pilot / incident lockdown env snippets.</p>
          </Panel>
        </Link>
        <Link href="/admin/ops">
          <Panel>
            <p className="font-semibold">Ops & launch</p>
            <p className="muted text-sm">Runbooks, launch gate, demo checklist.</p>
          </Panel>
        </Link>
      </div>

      <div className="mt-6 max-w-xs">
        <SignOutButton />
      </div>
    </main>
  );
}
