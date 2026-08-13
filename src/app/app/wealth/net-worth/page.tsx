import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard } from "@/services/wealth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export default async function NetWorthDetailPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const snapshots = await prisma.wealthSnapshot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 12,
  });

  const nw = dash.netWorth;

  return (
    <main>
      <PageHeader
        title="Net worth detail"
        subtitle="Attributable assets minus liabilities, with confidence and history."
      />

      <Panel>
        <p className="eyebrow">Estimated net worth</p>
        <p className="font-display mt-1 text-5xl tracking-tight">
          {formatNaira(nw.netWorthNgn, true)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={nw.confidence >= 0.75 ? "default" : "warn"}>
            Confidence {Math.round(nw.confidence * 100)}%
          </Badge>
          <Badge>Engine {nw.engineVersion}</Badge>
          <Badge>FX {nw.fxEngineVersion}</Badge>
        </div>
        <p className="muted mt-3 text-sm">
          This is an estimate. Joint ownership, stale valuations and FX coverage all affect
          confidence. Estimated values are never shown as bank-verified facts.
        </p>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Assets</p>
          <p className="font-display mt-1 text-2xl">{formatNaira(nw.totalAssetsNgn, true)}</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Liabilities</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(nw.totalLiabilitiesNgn, true)}
          </p>
        </Panel>
      </div>

      <Panel className="mt-3">
        <p className="eyebrow">Composition</p>
        <ul className="mt-3 space-y-2 text-sm">
          {nw.assetBreakdown.map((b) => (
            <li key={b.category} className="flex justify-between gap-3">
              <span>{b.category}</span>
              <span>
                {b.percent.toFixed(1)}% · {formatNaira(b.valueNgn, true)}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/app/wealth/allocation" className="mt-3 inline-block text-sm font-semibold text-accent">
          Full allocation view
        </Link>
      </Panel>

      <Panel className="mt-3">
        <p className="eyebrow">Currency exposure</p>
        <ul className="mt-3 space-y-2 text-sm">
          {nw.currencyExposure.map((c) => (
            <li key={c.currency} className="flex justify-between gap-3">
              <span>{c.currency}</span>
              <span>
                {c.percent.toFixed(1)}% · {formatNaira(c.valueNgn, true)}
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
          <Link href="/app/wealth/confidence" className="mt-3 inline-block text-sm font-semibold text-accent">
            Review data confidence
          </Link>
        </Panel>
      )}

      <Panel className="mt-3">
        <p className="eyebrow">History</p>
        {snapshots.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {snapshots.map((s) => (
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
