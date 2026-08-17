import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, HeroMetric, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { NetWorthCurve } from "@/components/charts/NetWorthCurve";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard, loadWealthVisualContext } from "@/services/wealth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export default async function NetWorthDetailPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const [snapshots, visuals] = await Promise.all([
    prisma.wealthSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 24,
    }),
    loadWealthVisualContext(user.id),
  ]);

  const nw = dash.netWorth;
  const now = Date.now();
  const monthAgo = findNearestSnapshot(snapshots, now - 30 * 24 * 60 * 60 * 1000);
  const yearAgo = findNearestSnapshot(snapshots, now - 365 * 24 * 60 * 60 * 1000);
  const monthMove = monthAgo != null ? nw.netWorthNgn - monthAgo.netWorthNgn : dash.monthChange;
  const yearMove = yearAgo != null ? nw.netWorthNgn - yearAgo.netWorthNgn : null;
  const startMonth = monthAgo?.netWorthNgn ?? (monthMove != null ? nw.netWorthNgn - monthMove : null);

  const waterfall = [
    {
      id: "assets",
      label: "Total assets",
      value: nw.totalAssetsNgn,
      tone: "pos" as const,
    },
    {
      id: "liabilities",
      label: "Total liabilities",
      value: -nw.totalLiabilitiesNgn,
      tone: "neg" as const,
    },
    {
      id: "nw",
      label: "Estimated net worth",
      value: nw.netWorthNgn,
      tone: "end" as const,
    },
  ];
  const maxAbs = Math.max(...waterfall.map((w) => Math.abs(w.value)), 1);

  return (
    <main>
      <PageHeader
        title="Net worth"
        subtitle="How estimated net worth is built — attributable assets minus liabilities, with confidence."
      />

      <HeroMetric
        label="Estimated net worth"
        value={formatNaira(nw.netWorthNgn, true)}
        hint={
          <>
            <Badge tone={nw.confidence >= 0.75 ? "default" : "warn"}>
              Confidence {Math.round(nw.confidence * 100)}%
            </Badge>
            <Badge>Engine {nw.engineVersion}</Badge>
          </>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Month movement</p>
          <p className="font-display mt-1 text-2xl">
            {monthMove == null
              ? "—"
              : `${monthMove >= 0 ? "+" : ""}${formatNaira(monthMove, true)}`}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Year movement</p>
          <p className="font-display mt-1 text-2xl">
            {yearMove == null
              ? "—"
              : `${yearMove >= 0 ? "+" : ""}${formatNaira(yearMove, true)}`}
          </p>
        </Panel>
      </div>

      <Panel className="mt-4">
        <p className="eyebrow">Composition waterfall</p>
        <p className="muted mt-1 text-sm">
          Engines calculate this from your Wealth Graph — no invented income or spend lines.
        </p>
        <ul className="mt-4 space-y-3">
          {waterfall.map((step) => (
            <li key={step.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">{step.label}</span>
                <span className="tabular-nums">
                  {step.tone === "neg" ? "−" : ""}
                  {formatNaira(Math.abs(step.value), true)}
                </span>
              </div>
              <div className="wealth-waterfall-track mt-1.5" aria-hidden>
                <div
                  className={`wealth-waterfall-fill is-${step.tone}`}
                  style={{ width: `${Math.max(6, (Math.abs(step.value) / maxAbs) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        {startMonth != null && monthMove != null ? (
          <InsightPanel className="mt-4" eyebrow="Period bridge (≈1 month)">
            Started near {formatNaira(startMonth, true)} · moved{" "}
            {monthMove >= 0 ? "+" : ""}
            {formatNaira(monthMove, true)} · ends at {formatNaira(nw.netWorthNgn, true)}. Detailed
            income/gain attribution needs connected cash-flow history — we do not invent it here.
          </InsightPanel>
        ) : null}
      </Panel>

      <div className="mt-4">
        <NetWorthCurve
          currentNetWorthNgn={nw.netWorthNgn}
          snapshots={visuals.snapshots}
          rates={visuals.rates}
          changeNgn={monthMove}
          confidencePct={Math.round(nw.confidence * 100)}
        />
      </div>

      <Panel className="mt-4">
        <p className="eyebrow">Drilldown by category</p>
        <ul className="mt-3 space-y-2 text-sm">
          {nw.assetBreakdown.map((b) => (
            <li key={b.category} className="flex justify-between gap-3">
              <Link href="/app/wealth/allocation" className="font-semibold text-accent">
                {b.category}
              </Link>
              <span>
                {b.percent.toFixed(1)}% · {formatNaira(b.valueNgn, true)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {(nw.staleAssetIds.length > 0 || nw.missingFx.length > 0) && (
        <Panel className="mt-3">
          <p className="eyebrow">Data quality notes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {nw.staleAssetIds.length > 0 ? (
              <li>{nw.staleAssetIds.length} stale valuation(s) reduce confidence.</li>
            ) : null}
            {nw.missingFx.length > 0 ? (
              <li>{nw.missingFx.length} holding(s) skipped due to missing FX rates.</li>
            ) : null}
          </ul>
          <Link
            href="/app/wealth/confidence"
            className="mt-3 inline-block text-sm font-semibold text-accent"
          >
            Review data confidence
          </Link>
        </Panel>
      )}

      <Panel className="mt-3">
        <p className="eyebrow">Snapshot history</p>
        {snapshots.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {snapshots.slice(-12).map((s) => (
              <li key={s.id} className="flex justify-between gap-3">
                <span>
                  {s.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="font-semibold">{formatNaira(s.netWorthNgn, true)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted mt-2 text-sm">Snapshots appear as your Wealth Graph is refreshed.</p>
        )}
      </Panel>
    </main>
  );
}

function findNearestSnapshot(
  snapshots: { createdAt: Date; netWorthNgn: number }[],
  targetMs: number,
) {
  if (!snapshots.length) return null;
  let best = snapshots[0];
  let bestDist = Math.abs(best.createdAt.getTime() - targetMs);
  for (const s of snapshots) {
    const d = Math.abs(s.createdAt.getTime() - targetMs);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  // Only treat as a period anchor if within ~45 days of the target
  if (bestDist > 45 * 24 * 60 * 60 * 1000) return null;
  return best;
}
