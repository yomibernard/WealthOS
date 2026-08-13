import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge, PageHeader, Panel } from "@/components/ui";
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
        subtitle="Open-banking demo rail with consent-gated sync. No real bank login — balances refresh in demo only."
      />

      {flags.openBankingDemo ? (
        <ConnectionsClient initialConnections={serialised} banks={availableDemoBanks()} />
      ) : (
        <Panel>
          <p className="muted">Open-banking demo is currently disabled.</p>
          <div className="mt-3 space-y-3">
            {connections.map((c) => (
              <div key={c.id} className="flex justify-between gap-3 text-sm">
                <span>{c.providerName}</span>
                <Badge>{c.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel className="mt-4">
        <p className="eyebrow">Linked consents</p>
        <ul className="mt-2 space-y-2 text-sm">
          {consents.map((c) => (
            <li key={c.id} className="flex justify-between gap-3">
              <span>{c.serviceName}</span>
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
