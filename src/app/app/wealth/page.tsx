import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, HeroMetric, InsightPanel, PageHeader } from "@/components/ui";
import { WealthOverviewClient } from "@/components/wealth/WealthOverviewClient";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { buildWealthMapSegments } from "@/engines/wealth-visuals";
import { formatNaira } from "@/lib/format";

export default async function WealthPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const assets = await prisma.asset.findMany({
    where: { userId: user.id },
    orderBy: { value: "desc" },
  });
  const liabilities = await prisma.liability.findMany({
    where: { userId: user.id },
    orderBy: { balance: "desc" },
  });

  const mapSegments = buildWealthMapSegments(
    dash.netWorth.assetBreakdown,
    dash.netWorth.totalLiabilitiesNgn,
  );

  const topClass = dash.netWorth.assetBreakdown[0];
  const topCurrency = dash.netWorth.currencyExposure[0];

  return (
    <main>
      <PageHeader
        title="Wealth"
        subtitle="Your complete financial world — estimated, labelled, and honest about confidence."
        action={
          <Link href="/app/wealth/add" className="btn btn-soft">
            Add
          </Link>
        }
      />

      <HeroMetric
        label="Estimated net worth"
        value={formatNaira(dash.netWorth.netWorthNgn, true)}
        hint={
          <>
            <Badge>Confidence {Math.round(dash.netWorth.confidence * 100)}%</Badge>
            <Link href="/app/wealth/net-worth" className="text-sm font-semibold text-accent">
              How this was calculated
            </Link>
            <Link href="/app/wealth/confidence" className="text-sm font-semibold text-accent">
              Data confidence
            </Link>
          </>
        }
      />

      {(topClass || topCurrency) && (
        <InsightPanel className="mt-4" eyebrow="At a glance">
          {topClass
            ? `${formatCategory(topClass.category)} represents about ${Math.round(topClass.percent)}% of estimated assets`
            : null}
          {topClass && topCurrency ? " · " : null}
          {topCurrency
            ? `${topCurrency.currency} exposure is about ${Math.round(topCurrency.percent)}% of the picture`
            : null}
          .
        </InsightPanel>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link href="/app/wealth/net-worth" className="wealth-stat-link">
          <p className="eyebrow">Assets</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(dash.netWorth.totalAssetsNgn, true)}
          </p>
        </Link>
        <Link href="/app/wealth/net-worth" className="wealth-stat-link">
          <p className="eyebrow">Liabilities</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(dash.netWorth.totalLiabilitiesNgn, true)}
          </p>
        </Link>
        <Link href="/app/wealth/allocation" className="wealth-stat-link">
          <p className="eyebrow">Allocation</p>
          <p className="mt-1 text-sm font-semibold text-accent">Class & currency →</p>
        </Link>
      </div>

      <WealthOverviewClient
        segments={mapSegments}
        totalAssetsNgn={dash.netWorth.totalAssetsNgn}
        assets={assets.map((a) => ({
          id: a.id,
          name: a.name,
          provider: a.provider,
          assetType: a.assetType,
          ownershipPercent: a.ownershipPercent,
          value: a.value,
          currency: a.currency,
          source: a.source,
          verificationStatus: a.verificationStatus,
          lastValuationDate: a.lastValuationDate.toISOString(),
          category: a.category,
          coverStorageKey: a.coverStorageKey,
        }))}
        liabilities={liabilities.map((l) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          balance: l.balance,
          currency: l.currency,
        }))}
      />

      <section className="mt-6">
        <h2 className="font-display text-xl">Currency exposure</h2>
        <ul className="mt-3 space-y-2">
          {dash.netWorth.currencyExposure.map((c) => (
            <li key={c.currency} className="wealth-bar-row">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{c.currency}</span>
                <span>
                  {c.percent.toFixed(1)}% · {formatNaira(c.valueNgn, true)}
                </span>
              </div>
              <div className="wealth-bar-track" aria-hidden>
                <div
                  className="wealth-bar-fill"
                  style={{ width: `${Math.min(100, c.percent)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="muted mt-3 text-sm">
          Geographic exposure is not modelled separately yet — currency is the honest proxy for
          where risk sits today.
        </p>
      </section>
    </main>
  );
}

function formatCategory(raw: string) {
  return raw
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
