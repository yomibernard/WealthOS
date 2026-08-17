import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, HeroMetric, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { RemediationActions } from "@/components/DataQualityClient";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { assessItem, buildDataQualityReport } from "@/engines/data-quality";
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

  const qualityInputs = [
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
  ];

  const report = buildDataQualityReport(qualityInputs, dash.netWorth.confidence);
  const assessed = qualityInputs.map((i) => assessItem(i));

  const valueById = new Map<string, number>([
    ...assets.map((a) => [a.id, a.value] as const),
    ...liabilities.map((l) => [l.id, l.balance] as const),
  ]);

  const verified = assessed.filter(
    (i) =>
      i.verificationStatus === "VERIFIED" &&
      !i.issues.some((x) => x.code === "stale_valuation" && x.severity === "high"),
  );
  const needsRefresh = assessed.filter(
    (i) =>
      i.verificationStatus === "STALE" ||
      i.issues.some((x) => x.code === "stale_valuation"),
  );
  const estimated = assessed.filter(
    (i) =>
      i.verificationStatus === "ESTIMATED" &&
      !needsRefresh.some((n) => n.id === i.id),
  );

  const missingImpact =
    report.highPriorityCount > 0
      ? `Refreshing ${report.highPriorityCount} high-priority line(s) is the fastest way to lift overall confidence (now ${Math.round(dash.netWorth.confidence * 100)}%).`
      : report.items.length > 0
        ? "Optional refreshes on estimated lines will tighten the picture without inventing balances."
        : "No material gaps — keep quarterly confirms on property and private holdings.";

  return (
    <main>
      <PageHeader
        title="Data confidence"
        subtitle="Which lines are trustworthy, which need a refresh, and which remain estimates."
      />

      <HeroMetric
        label="Overall confidence"
        value={`${Math.round(dash.netWorth.confidence * 100)}%`}
        hint={
          <Badge tone={report.highPriorityCount > 0 ? "warn" : "default"}>
            Quality {report.overallScore}/100 · {report.highPriorityCount} high-priority
          </Badge>
        }
      />

      <InsightPanel className="mt-4" eyebrow="Estimated impact of missing data">
        {missingImpact}
      </InsightPanel>

      <div className="mt-4">
        <Link href="/app/wealth/add" className="btn btn-accent">
          Improve my wealth picture
        </Link>
      </div>

      <ConfidenceBucket
        title="Verified"
        empty="No fully verified holdings yet — connected or confirmed lines will appear here."
        items={verified}
        valueById={valueById}
      />
      <ConfidenceBucket
        title="Needs refresh"
        empty="Nothing urgently stale — keep confirming ageing valuations."
        items={needsRefresh}
        valueById={valueById}
        showRemediation
      />
      <ConfidenceBucket
        title="Estimated"
        empty="No estimated-only lines in this bucket."
        items={estimated}
        valueById={valueById}
      />

      {report.items.length ? (
        <div className="mt-5 space-y-3">
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
        <Panel className="mt-5">
          <p className="font-medium">No remediation items</p>
          <p className="muted mt-1 text-sm">{report.summary}</p>
        </Panel>
      )}

      <div className="mt-5 space-y-3">
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

function ConfidenceBucket({
  title,
  empty,
  items,
  valueById,
  showRemediation,
}: {
  title: string;
  empty: string;
  items: ReturnType<typeof assessItem>[];
  valueById: Map<string, number>;
  showRemediation?: boolean;
}) {
  return (
    <section className="mt-5">
      <h2 className="font-display text-xl">{title}</h2>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="asset-tile">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="muted text-sm">
                    {item.kind} ·{" "}
                    {formatCurrency(valueById.get(item.id) ?? 0, item.currency, true)} ·{" "}
                    {item.verificationStatus}
                  </p>
                </div>
                <Badge>{Math.round(item.confidence * 100)}%</Badge>
              </div>
              {showRemediation ? (
                <RemediationActions
                  id={item.id}
                  kind={item.kind}
                  currentValue={valueById.get(item.id) ?? 0}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted mt-2 text-sm">{empty}</p>
      )}
    </section>
  );
}
