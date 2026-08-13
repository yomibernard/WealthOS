import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADMIN") redirect("/app");

  const [customers, products, escalations, audits, providers] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.escalation.count({ where: { status: "open" } }),
    prisma.auditEvent.count(),
    prisma.provider.count(),
  ]);

  return (
    <main className="page-wide">
      <PageHeader
        title="Admin portal"
        subtitle="Operations with dual-control maker-checker for high-risk changes."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          <p className="eyebrow">Open escalations</p>
          <p className="font-display text-3xl">{escalations}</p>
        </Panel>
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
            <p className="font-semibold">Audit logs</p>
            <p className="muted text-sm">Structured recommendation and consent events.</p>
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
            <p className="font-semibold">Feature flags</p>
            <p className="muted text-sm">Runtime FF_* rollout switches.</p>
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
