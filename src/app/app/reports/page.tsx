import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel, EmptyState } from "@/components/ui";
import { GenerateMonthlyReportButton } from "@/components/MonthlyReportClient";
import { NetWorthSparkline } from "@/components/NetWorthSparkline";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { listMonthlyReportHistory } from "@/services/wealth-report";
import { formatNaira } from "@/lib/format";

export default async function MonthlyReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const flags = getFeatureFlags();
  if (!flags.monthlyReports) {
    return (
      <main>
        <PageHeader title="Monthly reports" subtitle="This capability is temporarily unavailable." />
      </main>
    );
  }

  const { latest, history, insights } = await listMonthlyReportHistory(user.id);

  return (
    <main>
      <PageHeader
        title="Monthly wealth report"
        subtitle="Private-bank style reviews of position, movement, and next steps — informational only."
      />

      <section className="hero-metric space-y-3 print:hidden">
        <p className="eyebrow">For {user.name}</p>
        <p className="text-sm leading-relaxed">
          Generate a Wealth Snapshot you can revisit and print. Reports never move money and are not a
          product solicitation.
        </p>
        <GenerateMonthlyReportButton />
      </section>

      <Panel className="mt-4 space-y-3">
        <p className="eyebrow">Trend</p>
        <NetWorthSparkline values={insights.points.map((p) => p.netWorthNgn)} />
        {insights.netWorthDeltaNgn != null ? (
          <p className="text-sm">
            Latest vs prior:{" "}
            <span className="font-semibold">
              {insights.netWorthDeltaNgn >= 0 ? "+" : ""}
              {formatNaira(insights.netWorthDeltaNgn, true)}
            </span>
            {insights.healthDelta != null
              ? ` · health ${insights.healthDelta >= 0 ? "+" : ""}${insights.healthDelta}`
              : ""}
          </p>
        ) : (
          <p className="muted text-sm">{insights.narrative}</p>
        )}
        <ul className="mt-2 space-y-2">
          {insights.insights.slice(0, 3).map((i) => (
            <li key={i.id}>
              <p className="font-medium">{i.title}</p>
              <p className="muted text-sm">{i.body}</p>
            </li>
          ))}
        </ul>
      </Panel>

      {latest ? (
        <section className="action-card mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Latest report</p>
            <Badge>{new Date(latest.generatedAt).toLocaleDateString("en-NG")}</Badge>
          </div>
          <p className="font-display text-3xl font-semibold tracking-tight">
            {formatNaira(latest.netWorthNgn, true)}
          </p>
          <p className="muted text-sm">
            Health {latest.healthScore}/100 · confidence {Math.round(latest.confidence * 100)}%
          </p>
          <Link href={`/app/reports/${latest.snapshotId}`} className="btn btn-soft inline-flex">
            Open full report
          </Link>
        </section>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No reports yet"
            body="Generate your first monthly review to create a Wealth Snapshot you can return to."
            action={<p className="muted text-sm">Use Generate above when you are ready.</p>}
          />
        </div>
      )}

      <Panel className="mt-4 space-y-3">
        <p className="eyebrow">History</p>
        {history.length === 0 ? (
          <p className="muted text-sm">Snapshots will appear here after you generate a report.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <div>
                  <Link
                    href={`/app/reports/${h.id}`}
                    className="font-medium text-ink underline-offset-2 hover:underline"
                  >
                    {new Date(h.createdAt).toLocaleString("en-NG")}
                  </Link>
                  <p className="muted text-sm">
                    {formatNaira(h.netWorthNgn, true)}
                    {h.healthScore != null ? ` · health ${h.healthScore}` : ""}
                    {h.deltaNgn != null
                      ? ` · ${h.deltaNgn >= 0 ? "+" : ""}${formatNaira(h.deltaNgn, true)} vs prior`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="muted mt-4 text-sm print:hidden">
        <Link href="/app/notifications">Notification preferences</Link> control whether informational
        report notices are created.
      </p>
    </main>
  );
}
