import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { PrintReportButton } from "@/components/PrintReportButton";
import { NetWorthSparkline } from "@/components/NetWorthSparkline";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getMonthlyReportSnapshot, listMonthlyReportHistory } from "@/services/wealth-report";
import { buildReportInsights } from "@/engines/report-insights";
import { formatNaira } from "@/lib/format";

export default async function MonthlyReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const flags = getFeatureFlags();
  if (!flags.monthlyReports) redirect("/app/reports");

  const { id } = await params;
  const report = await getMonthlyReportSnapshot(user.id, id);
  if (!report) notFound();

  const { history } = await listMonthlyReportHistory(user.id, 12);
  const idx = history.findIndex((h) => h.id === id);
  const window = history.slice(idx >= 0 ? idx : 0).slice(0, 6);
  const insights = buildReportInsights(
    window.map((h) => ({
      id: h.id,
      createdAt: h.createdAt,
      netWorthNgn: h.netWorthNgn,
      healthScore: h.healthScore,
      confidence: h.confidence,
    })),
  );

  return (
    <main className="report-print">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Wealth report"
          subtitle={new Date(report.generatedAt).toLocaleString("en-NG")}
        />
        <PrintReportButton />
      </div>

      <Panel className="space-y-2">
        <p className="eyebrow">Estimated net worth</p>
        <p className="font-display text-4xl">{formatNaira(report.netWorthNgn, true)}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>Health {report.healthScore}/100</Badge>
          <Badge>Confidence {Math.round(report.confidence * 100)}%</Badge>
          {insights.netWorthDeltaNgn != null ? (
            <Badge tone={insights.netWorthDeltaNgn >= 0 ? "default" : "warn"}>
              {insights.netWorthDeltaNgn >= 0 ? "+" : ""}
              {formatNaira(insights.netWorthDeltaNgn, true)} vs prior
            </Badge>
          ) : null}
        </div>
        <NetWorthSparkline values={insights.points.map((p) => p.netWorthNgn)} />
      </Panel>

      {insights.insights.length ? (
        <Panel className="mt-4 space-y-3">
          <h2 className="font-display text-xl">Month-over-month</h2>
          <ul className="space-y-3">
            {insights.insights.map((i) => (
              <li key={i.id}>
                <p className="font-medium">{i.title}</p>
                <p className="muted text-sm">{i.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="mt-4 space-y-3">
        {report.sections.map((s) => (
          <Panel key={s.id} className="space-y-2">
            <h2 className="font-display text-xl">{s.title}</h2>
            <p className="text-sm leading-relaxed">{s.body}</p>
          </Panel>
        ))}
      </div>

      {report.topActions.length > 0 ? (
        <Panel className="mt-4 space-y-3">
          <h2 className="font-display text-xl">Actions in this cycle</h2>
          <ul className="space-y-3">
            {report.topActions.map((a) => (
              <li key={a.id}>
                <p className="font-medium">{a.title}</p>
                <p className="muted text-sm">{a.why}</p>
              </li>
            ))}
          </ul>
          <Link href="/app/actions" className="btn btn-soft inline-flex print:hidden">
            Review recommendations
          </Link>
        </Panel>
      ) : null}

      <Panel className="mt-4">
        <p className="muted text-sm">{report.disclaimer}</p>
      </Panel>

      <p className="mt-4 print:hidden">
        <Link href="/app/reports" className="text-sm font-medium underline-offset-2 hover:underline">
          ← All reports
        </Link>
      </p>
    </main>
  );
}
