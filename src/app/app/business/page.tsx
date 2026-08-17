import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, HeroMetric, InsightPanel, PageHeader, Panel } from "@/components/ui";
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
        <PageHeader title="Business wealth" subtitle="Temporarily unavailable." />
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

  const ofNetWorth =
    nw.netWorthNgn !== 0
      ? Math.abs(intel.netBusinessEquityNgn / Math.max(1, Math.abs(nw.netWorthNgn)))
      : 0;

  const byId = new Map(businesses.map((b) => [b.id, b]));

  return (
    <main>
      <PageHeader
        title="Business wealth"
        subtitle="Private interests treated seriously — ownership-adjusted estimates, not precise company valuations."
      />

      <HeroMetric
        label="Estimated net business equity"
        value={formatNaira(intel.netBusinessEquityNgn, true)}
        hint={
          <>
            <Badge>{intel.engineVersion}</Badge>
            <Badge tone={intel.concentrationOfAssets >= 0.45 ? "warn" : "default"}>
              {formatPercent(intel.concentrationOfAssets * 100, 0)} of assets
            </Badge>
          </>
        }
      />

      <InsightPanel className="mt-4" eyebrow="Concentration">
        Business represents about {formatPercent(ofNetWorth * 100, 0)} of estimated net worth.{" "}
        {intel.narrative}
      </InsightPanel>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Owned value</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.businessValueOwnedNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Debt exposure</p>
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
          <p className="eyebrow">Income / dividend lens</p>
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

      <section className="mt-5">
        <h2 className="font-display text-xl">Holdings</h2>
        <div className="mt-3 space-y-3">
          {intel.holdings.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No business assets yet.{" "}
                <Link href="/app/wealth/add" className="font-semibold text-accent">
                  Add an interest
                </Link>
              </p>
            </Panel>
          ) : (
            intel.holdings.map((h) => {
              const raw = byId.get(h.id);
              return (
                <article key={h.id} className="asset-tile">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft font-display text-lg text-accent">
                        {(h.name[0] ?? "B").toUpperCase()}
                      </div>
                      <p className="mt-2 font-semibold">{h.name}</p>
                      <p className="muted text-sm">
                        Ownership {raw?.ownershipPercent ?? 100}% ·{" "}
                        {h.verificationStatus.toLowerCase()}
                        {h.stale ? " · stale valuation" : ""} · confidence{" "}
                        {formatPercent(h.confidence * 100, 0)}
                      </p>
                    </div>
                    <p className="font-display text-xl">{formatNaira(h.ownedValueNgn, true)}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <p className="muted mt-4 text-xs">{intel.disclaimer}</p>
    </main>
  );
}
