import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { ConnectionsClient } from "@/components/ConnectionsClient";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getFeatureFlags } from "@/lib/feature-flags";
import { availableDemoBanks } from "@/services/connections";

export default async function ConnectionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const flags = getFeatureFlags();
  const [connections, consents] = await Promise.all([
    prisma.connection.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.consent.findMany({ where: { userId: user.id } }),
  ]);

  const serialised = connections.map((c) => ({
    id: c.id,
    providerName: c.providerName,
    kind: c.kind,
    status: c.status,
    lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
    lastError: c.lastError,
  }));

  return (
    <main>
      <PageHeader
        title="Connections"
        subtitle="Institutions you link — demo rails labelled simulated. Consent-gated sync only."
      />

      <section className="hero-metric">
        <p className="eyebrow">Linked institutions</p>
        <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          {connections.length} connection{connections.length === 1 ? "" : "s"}
        </h2>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
          No real bank login in this demo. Balances refresh in simulation only — always labelled.
        </p>
      </section>

      <InsightPanel className="mt-4" eyebrow="Simulated demo">
        Open-banking connections here are <strong>simulated</strong>. Credentials never leave this
        device for a live bank API. Pause or revoke anytime in Consent.
      </InsightPanel>

      <div className="mt-4">
        {flags.openBankingDemo ? (
          <ConnectionsClient initialConnections={serialised} banks={availableDemoBanks()} />
        ) : (
          <Panel>
            <p className="muted">Open-banking demo is currently disabled.</p>
            <div className="mt-3 space-y-3">
              {connections.map((c) => (
                <div key={c.id} className="flex justify-between gap-3 text-sm">
                  <span>
                    {c.providerName}{" "}
                    <Badge>simulated</Badge>
                  </span>
                  <Badge>{c.status}</Badge>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      <Panel className="mt-4">
        <p className="eyebrow">Linked consents</p>
        <p className="muted mt-1 text-sm">Permission status for connected data sources.</p>
        <ul className="mt-2 space-y-2 text-sm">
          {consents.map((c) => (
            <li key={c.id} className="flex justify-between gap-3">
              <span>
                {c.serviceName}
                <span className="muted"> · {c.dataUsed}</span>
              </span>
              <Badge tone={c.status === "ACTIVE" ? "default" : "warn"}>{c.status}</Badge>
            </li>
          ))}
        </ul>
        <Link href="/app/consent" className="mt-3 inline-block text-sm font-semibold text-accent">
          Open Consent Centre
        </Link>
      </Panel>
    </main>
  );
}
