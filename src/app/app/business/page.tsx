import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { calculateNetWorth } from "@/engines/net-worth";
import { analyseBusiness } from "@/engines/business";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

function toMonthly(amount: number, frequency: string): number {
  if (frequency === "annual" || frequency === "yearly") return amount / 12;
  if (frequency === "weekly") return amount * 4.333;
  return amount;
}

export default async function BusinessPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().businessIntel) {
    return (
      <main>
        <PageHeader title="Business intelligence" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [assets, liabilities, incomes, rates] = await Promise.all([
    prisma.asset.findMany({ where: { userId: user.id } }),
    prisma.liability.findMany({ where: { userId: user.id } }),
    prisma.income.findMany({ where: { userId: user.id } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const nw = calculateNetWorth(assets, liabilities, rates);
  const businesses = assets.filter((a) => a.category === "BUSINESS");
  const loans = liabilities.filter((l) => l.type === "BUSINESS_LOAN");
  const monthlyIncome = incomes.reduce(
    (s, i) => s + fx(i.currency, toMonthly(i.amount, i.frequency)),
    0,
  );
  const businessIncome = incomes
    .filter((i) => /business|divid|director|owner/i.test(`${i.type} ${i.label}`))
    .reduce((s, i) => s + fx(i.currency, toMonthly(i.amount, i.frequency)), 0);

  const intel = analyseBusiness(
    businesses,
    loans,
    nw.totalAssetsNgn,
    monthlyIncome,
    businessIncome,
    fx,
  );

  return (
    <main>
      <PageHeader
        title="Business intelligence"
        subtitle="Ownership-adjusted equity and leverage — not a company valuation."
      />

      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge>{intel.engineVersion}</Badge>
          <Badge tone={intel.concentrationOfAssets >= 0.45 ? "warn" : "default"}>
            {formatPercent(intel.concentrationOfAssets * 100, 0)} of assets
          </Badge>
        </div>
        <p className="font-display mt-3 text-4xl">
          {formatNaira(intel.netBusinessEquityNgn, true)}
        </p>
        <p className="muted text-sm">Estimated net business equity</p>
        <p className="mt-4 leading-relaxed">{intel.narrative}</p>
        <p className="muted mt-3 text-xs">{intel.disclaimer}</p>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Owned value</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.businessValueOwnedNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Business debt</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.businessDebtNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">High-rate debt</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.highInterestDebtNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Income dependency</p>
          <p className="font-display mt-1 text-2xl">
            {intel.incomeDependencyShare == null
              ? "—"
              : formatPercent(intel.incomeDependencyShare * 100, 0)}
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

      <section className="mt-5" aria-labelledby="biz-holdings">
        <h2 id="biz-holdings" className="font-display text-xl">
          Holdings
        </h2>
        <div className="mt-3 space-y-3">
          {intel.holdings.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No business assets yet.{" "}
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
                      {h.verificationStatus.toLowerCase()}
                      {h.stale ? " · stale valuation" : ""}
                      {" · "}
                      confidence {formatPercent(h.confidence * 100, 0)}
                    </p>
                  </div>
                  <p className="font-display text-xl">{formatNaira(h.ownedValueNgn, true)}</p>
                </div>
              </Panel>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
