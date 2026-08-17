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

  const periodLabel = new Date(report.generatedAt).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="report-print report-doc">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <PageHeader title="Wealth report" subtitle={periodLabel} />
        <PrintReportButton />
      </div>

      <header className="report-cover">
        <p className="eyebrow">Private wealth review</p>
        <h1 className="report-cover-title">Monthly Wealth Report</h1>
        <p className="report-cover-name">{user.name}</p>
        <p className="muted mt-2 text-sm">{periodLabel}</p>
        <p className="report-cover-promise mt-4">
          A calm snapshot of position, movement, and what deserves attention — informational only.
        </p>
      </header>

      <section className="report-hero-metric mt-4">
        <p className="eyebrow">Estimated net worth</p>
        <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {formatNaira(report.netWorthNgn, true)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>Health {report.healthScore}/100</Badge>
          <Badge>Confidence {Math.round(report.confidence * 100)}%</Badge>
          {insights.netWorthDeltaNgn != null ? (
            <Badge tone={insights.netWorthDeltaNgn >= 0 ? "default" : "warn"}>
              {insights.netWorthDeltaNgn >= 0 ? "+" : ""}
              {formatNaira(insights.netWorthDeltaNgn, true)} vs prior
            </Badge>
          ) : null}
        </div>
        <div className="mt-4">
          <NetWorthSparkline values={insights.points.map((p) => p.netWorthNgn)} />
        </div>
      </section>

      {insights.insights.length ? (
        <section className="report-section mt-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">What changed</h2>
          <ul className="mt-3 space-y-3">
            {insights.insights.map((i) => (
              <li key={i.id} className="report-insight">
                <p className="font-semibold">{i.title}</p>
                <p className="muted mt-1 text-sm leading-relaxed">{i.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.attention.length ? (
        <section className="report-section mt-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Major risks & gaps</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
            {report.attention.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-4 space-y-4">
        {report.sections.map((s) => (
          <section key={s.id} className="report-section">
            <h2 className="font-display text-xl font-semibold tracking-tight">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>

      {report.topActions.length > 0 ? (
        <section className="report-section mt-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Top priorities</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5">
            {report.topActions.map((a) => (
              <li key={a.id}>
                <p className="font-semibold">{a.title}</p>
                <p className="muted mt-1 text-sm leading-relaxed">{a.why}</p>
              </li>
            ))}
          </ol>
          <Link href="/app/actions" className="btn btn-soft mt-4 inline-flex print:hidden">
            Review recommendations
          </Link>
        </section>
      ) : null}

      <Panel className="mt-4">
        <p className="muted text-sm leading-relaxed">{report.disclaimer}</p>
      </Panel>

      <p className="mt-4 print:hidden">
        <Link href="/app/reports" className="text-sm font-medium underline-offset-2 hover:underline">
          ← All reports
        </Link>
      </p>
    </main>
  );
}
