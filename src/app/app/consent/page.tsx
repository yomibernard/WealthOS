import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, EmptyState, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { ConsentControls } from "@/components/ConsentControls";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function ConsentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const consents = await prisma.consent.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const active = consents.filter((c) => c.status === "ACTIVE").length;

  return (
    <main>
      <PageHeader
        title="Consent Centre"
        subtitle="Customer control — pause, reconnect, or revoke. Changes affect future personalised analysis immediately."
      />

      <section className="hero-metric">
        <p className="eyebrow">You are in control</p>
        <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          {active} active permission{active === 1 ? "" : "s"}
        </h2>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
          Each row shows the connected data source, what is used, why, last access, and status — not a
          legal dump.
        </p>
      </section>

      <InsightPanel className="mt-4" eyebrow="How this works">
        Pause stops future personalised use. Revoke ends the permission. Reconnect turns it back on.
        WealthAI respects these flags before tailored analysis.
      </InsightPanel>

      <div className="mt-5 space-y-3">
        {consents.length ? (
          consents.map((c) => (
            <Panel key={c.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.serviceName}</p>
                  <div className="mt-2">
                    <Badge tone={c.status === "ACTIVE" ? "default" : "warn"}>{c.status}</Badge>
                  </div>
                </div>
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="eyebrow">What data is used</dt>
                  <dd className="mt-1">{c.dataUsed}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Purpose</dt>
                  <dd className="mt-1">{c.purpose}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="eyebrow">Last access</dt>
                  <dd className="mt-1 muted">
                    {c.lastAccessAt
                      ? c.lastAccessAt.toLocaleString("en-GB")
                      : "Not accessed yet"}
                  </dd>
                </div>
              </dl>
              <ConsentControls consentId={c.id} status={c.status} />
            </Panel>
          ))
        ) : (
          <EmptyState
            title="No consents recorded yet"
            body="When you connect services or enable WealthAI personalisation, permissions appear here."
            action={
              <Link href="/app/connections" className="btn btn-accent">
                Review connections
              </Link>
            }
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/privacy" className="btn btn-ghost">
          Privacy Centre
        </Link>
        <Link href="/app/connections" className="btn btn-ghost">
          Connections
        </Link>
      </div>
    </main>
  );
}
