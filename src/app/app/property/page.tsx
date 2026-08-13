import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { calculateNetWorth } from "@/engines/net-worth";
import { analyseProperty } from "@/engines/property";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

export default async function PropertyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().propertyIntel) {
    return (
      <main>
        <PageHeader title="Property intelligence" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [assets, liabilities, rates] = await Promise.all([
    prisma.asset.findMany({ where: { userId: user.id } }),
    prisma.liability.findMany({ where: { userId: user.id } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const nw = calculateNetWorth(assets, liabilities, rates);
  const properties = assets.filter((a) => a.category === "PROPERTY");
  const mortgages = liabilities.filter((l) => l.type === "MORTGAGE");
  const intel = analyseProperty(properties, mortgages, nw.totalAssetsNgn, fx);

  return (
    <main>
      <PageHeader
        title="Property intelligence"
        subtitle="Equity, leverage, yield and concentration — estimates, not appraisals."
        action={
          <Link href="/app/plan/scenarios" className="btn btn-soft">
            Buy vs rent
          </Link>
        }
      />

      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge>{intel.engineVersion}</Badge>
          <Badge tone={intel.concentrationOfAssets >= 0.5 ? "warn" : "default"}>
            {formatPercent(intel.concentrationOfAssets * 100, 0)} of assets
          </Badge>
        </div>
        <p className="font-display mt-3 text-4xl">{formatNaira(intel.equityNgn, true)}</p>
        <p className="muted text-sm">Estimated property equity</p>
        <p className="mt-4 leading-relaxed">{intel.narrative}</p>
        <p className="muted mt-3 text-xs">{intel.disclaimer}</p>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Owned value</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.propertyValueOwnedNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Mortgages</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.mortgageBalanceNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">LTV</p>
          <p className="font-display mt-1 text-2xl">
            {intel.ltv == null ? "—" : formatPercent(intel.ltv * 100, 0)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Data confidence</p>
          <p className="font-display mt-1 text-2xl">
            {formatPercent(intel.weightedConfidence * 100, 0)}
          </p>
        </Panel>
      </div>

      {intel.signals.length > 0 ? (
        <Panel className="mt-3">
          <p className="eyebrow">Signals</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {intel.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <section className="mt-5" aria-labelledby="holdings-heading">
        <h2 id="holdings-heading" className="font-display text-xl">
          Holdings
        </h2>
        <div className="mt-3 space-y-3">
          {intel.holdings.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No property yet.{" "}
                <Link href="/app/wealth/add" className="font-semibold text-accent">
                  Add an asset
                </Link>
              </p>
            </Panel>
          ) : (
            intel.holdings.map((h) => (
              <Panel key={h.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{h.name}</p>
                    <p className="muted text-sm">
                      {h.assetType}
                      {h.stale ? " · stale valuation" : ` · ${h.verificationStatus.toLowerCase()}`}
                      {" · "}
                      confidence {formatPercent(h.confidence * 100, 0)}
                    </p>
                  </div>
                  <p className="font-display text-xl">{formatNaira(h.ownedValueNgn, true)}</p>
                </div>
                <p className="muted mt-2 text-sm">
                  Gross yield:{" "}
                  {h.grossYield == null ? "—" : formatPercent(h.grossYield * 100, 1)}
                  {" · "}
                  Last valuation ~{h.monthsSinceValuation} mo ago
                </p>
              </Panel>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
