import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { daysSince, provenanceLabel } from "@/lib/format";

export default async function ConfidencePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");
  const assets = await prisma.asset.findMany({ where: { userId: user.id } });

  return (
    <main>
      <PageHeader
        title="Data confidence"
        subtitle="Estimated values are never presented as precise verified facts."
      />
      <Panel>
        <p className="eyebrow">Overall confidence</p>
        <p className="font-display mt-1 text-4xl">
          {Math.round(dash.netWorth.confidence * 100)}%
        </p>
        <p className="muted mt-2 text-sm">
          Reflects provenance, freshness, ownership attribution and FX coverage.
        </p>
      </Panel>
      <div className="mt-3 space-y-3">
        {assets.map((a) => {
          const stale = daysSince(a.lastValuationDate) > 180;
          return (
            <Panel key={a.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{a.name}</p>
                <Badge tone={stale || a.verificationStatus === "ESTIMATED" ? "warn" : "default"}>
                  {a.source}
                </Badge>
              </div>
              <p className="muted mt-1 text-sm">
                {provenanceLabel(a.source, a.verificationStatus, a.lastValuationDate)} · confidence{" "}
                {Math.round(a.confidence * 100)}%
              </p>
            </Panel>
          );
        })}
      </div>
    </main>
  );
}
