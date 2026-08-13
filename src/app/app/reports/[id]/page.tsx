import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getMonthlyReportSnapshot } from "@/services/wealth-report";
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

  return (
    <main>
      <PageHeader
        title="Wealth report"
        subtitle={new Date(report.generatedAt).toLocaleString("en-NG")}
      />

      <Panel className="space-y-2">
        <p className="eyebrow">Estimated net worth</p>
        <p className="font-display text-4xl">{formatNaira(report.netWorthNgn, true)}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>Health {report.healthScore}/100</Badge>
          <Badge>Confidence {Math.round(report.confidence * 100)}%</Badge>
        </div>
      </Panel>

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
          <Link href="/app/actions" className="btn btn-soft inline-flex">
            Review recommendations
          </Link>
        </Panel>
      ) : null}

      <Panel className="mt-4">
        <p className="muted text-sm">{report.disclaimer}</p>
      </Panel>

      <p className="mt-4">
        <Link href="/app/reports" className="text-sm font-medium underline-offset-2 hover:underline">
          ← All reports
        </Link>
      </p>
    </main>
  );
}
