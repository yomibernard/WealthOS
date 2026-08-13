import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { RemediationActions } from "@/components/DataQualityClient";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { buildDataQualityReport } from "@/engines/data-quality";
import { formatCurrency, provenanceLabel } from "@/lib/format";

export default async function ConfidencePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const [assets, liabilities] = await Promise.all([
    prisma.asset.findMany({ where: { userId: user.id }, orderBy: { value: "desc" } }),
    prisma.liability.findMany({ where: { userId: user.id }, orderBy: { balance: "desc" } }),
  ]);

  const report = buildDataQualityReport(
    [
      ...assets.map((a) => ({
        id: a.id,
        kind: "asset" as const,
        name: a.name,
        source: a.source,
        verificationStatus: a.verificationStatus,
        confidence: a.confidence,
        lastValuationDate: a.lastValuationDate,
        currency: a.currency,
        categoryOrType: a.category,
      })),
      ...liabilities.map((l) => ({
        id: l.id,
        kind: "liability" as const,
        name: l.name,
        source: l.source,
        verificationStatus: l.verificationStatus,
        confidence: l.confidence,
        lastValuationDate: l.lastValuationDate,
        currency: l.currency,
        categoryOrType: l.type,
      })),
    ],
    dash.netWorth.confidence,
  );

  const valueById = new Map<string, number>([
    ...assets.map((a) => [a.id, a.value] as const),
    ...liabilities.map((l) => [l.id, l.balance] as const),
  ]);

  return (
    <main>
      <PageHeader
        title="Data confidence"
        subtitle="Estimated values are never presented as precise verified facts. Fix stale lines first."
      />
      <Panel>
        <p className="eyebrow">Overall confidence</p>
        <p className="font-display mt-1 text-4xl">
          {Math.round(dash.netWorth.confidence * 100)}%
        </p>
        <p className="muted mt-2 text-sm">
          Quality score {report.overallScore}/100 · {report.highPriorityCount} high-priority item(s)
        </p>
        <p className="mt-3 text-sm leading-relaxed">{report.summary}</p>
        <Link href="/app/wealth/add" className="btn btn-ghost mt-4 inline-flex">
          Add missing holding
        </Link>
      </Panel>

      {report.items.length ? (
        <div className="mt-3 space-y-3">
          <p className="eyebrow px-1">Remediation queue</p>
          {report.items.map((item) => (
            <Panel key={`${item.kind}-${item.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="muted text-sm">
                    {item.kind} · {formatCurrency(valueById.get(item.id) ?? 0, item.currency, true)} ·{" "}
                    {item.ageDays}d old
                  </p>
                </div>
                <Badge tone={item.issues.some((i) => i.severity === "high") ? "warn" : "default"}>
                  {Math.round(item.confidence * 100)}%
                </Badge>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {item.issues.map((i) => (
                  <li key={i.code + i.title}>
                    <span className="font-medium">{i.title}</span> — {i.detail}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm font-medium text-accent">{item.recommendedAction}</p>
              <RemediationActions
                id={item.id}
                kind={item.kind}
                currentValue={valueById.get(item.id) ?? 0}
              />
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="mt-3">
          <p className="font-medium">No remediation items</p>
          <p className="muted mt-1 text-sm">
            Nothing looks urgently stale. Keep confirming property and private holdings every quarter.
          </p>
        </Panel>
      )}

      <div className="mt-4 space-y-3">
        <p className="eyebrow px-1">All assets</p>
        {assets.map((a) => (
          <Panel key={a.id}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{a.name}</p>
              <Badge tone={a.verificationStatus === "ESTIMATED" ? "warn" : "default"}>
                {a.source}
              </Badge>
            </div>
            <p className="muted mt-1 text-sm">
              {provenanceLabel(a.source, a.verificationStatus, a.lastValuationDate)} · confidence{" "}
              {Math.round(a.confidence * 100)}%
            </p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
