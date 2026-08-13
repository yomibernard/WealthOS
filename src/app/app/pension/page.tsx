import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { calculateNetWorth } from "@/engines/net-worth";
import { analysePension } from "@/engines/pension";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

export default async function PensionPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().pensionIntel) {
    return (
      <main>
        <PageHeader title="Pension aggregation" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [assets, liabilities, goals, rates] = await Promise.all([
    prisma.asset.findMany({ where: { userId: user.id } }),
    prisma.liability.findMany({ where: { userId: user.id } }),
    prisma.goal.findMany({ where: { userId: user.id, type: "RETIREMENT" } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const nw = calculateNetWorth(assets, liabilities, rates);
  const pensions = assets.filter((a) => a.category === "PENSION");
  const retirement = goals[0]
    ? {
        targetAmount: goals[0].targetAmount,
        targetDate: goals[0].targetDate,
        existingAllocation: goals[0].existingAllocation,
        monthlyContribution: goals[0].monthlyContribution,
      }
    : null;

  const intel = analysePension(pensions, nw.totalAssetsNgn, retirement, fx);

  return (
    <main>
      <PageHeader
        title="Pension aggregation"
        subtitle="RSA and foreign pots in one view — estimates, not PenCom statements."
        action={
          <Link href="/app/plan" className="btn btn-soft">
            Retirement goal
          </Link>
        }
      />

      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge>{intel.engineVersion}</Badge>
          <Badge>{intel.pots.length} pots</Badge>
          {intel.currencies.map((c) => (
            <Badge key={c}>{c}</Badge>
          ))}
        </div>
        <p className="font-display mt-3 text-4xl">{formatNaira(intel.totalPensionNgn, true)}</p>
        <p className="muted text-sm">Aggregated pension capital (NGN)</p>
        <p className="mt-4 leading-relaxed">{intel.narrative}</p>
        <p className="muted mt-3 text-xs">{intel.disclaimer}</p>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">RSA (NGN)</p>
          <p className="font-display mt-1 text-2xl">{formatNaira(intel.rsaNgn, true)}</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Foreign (NGN)</p>
          <p className="font-display mt-1 text-2xl">{formatNaira(intel.foreignNgn, true)}</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Share of assets</p>
          <p className="font-display mt-1 text-2xl">
            {formatPercent(intel.concentrationOfAssets * 100, 0)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Illustrative gap</p>
          <p className="font-display mt-1 text-2xl">
            {intel.fundingGapNgn == null ? "—" : formatNaira(intel.fundingGapNgn, true)}
          </p>
        </Panel>
      </div>

      {intel.yearsToTarget != null ? (
        <Panel className="mt-3">
          <p className="eyebrow">Years to retirement target</p>
          <p className="font-display mt-1 text-2xl">{intel.yearsToTarget.toFixed(1)}</p>
          <p className="muted mt-1 text-sm">
            Gap uses a cautious illustrative return path — not a guarantee.
          </p>
        </Panel>
      ) : null}

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

      <section className="mt-5" aria-labelledby="pots-heading">
        <h2 id="pots-heading" className="font-display text-xl">
          Pots
        </h2>
        <div className="mt-3 space-y-3">
          {intel.pots.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No pension assets yet.{" "}
                <Link href="/app/wealth/add" className="font-semibold text-accent">
                  Add RSA or foreign pension
                </Link>
              </p>
            </Panel>
          ) : (
            intel.pots.map((p) => (
              <Panel key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="muted text-sm">
                      {p.kind}
                      {p.provider ? ` · ${p.provider}` : ""}
                      {p.stale ? " · stale" : ""}
                      {" · "}
                      {p.currency}
                    </p>
                  </div>
                  <p className="font-display text-xl">{formatNaira(p.ownedValueNgn, true)}</p>
                </div>
              </Panel>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
