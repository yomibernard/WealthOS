import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, HeroMetric, InsightPanel, PageHeader, Panel, ProgressBar } from "@/components/ui";
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
        <PageHeader title="Pension" subtitle="Temporarily unavailable." />
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
  const progressTowardGoal =
    retirement && retirement.targetAmount > 0
      ? Math.min(
          100,
          Math.round((intel.totalPensionNgn / retirement.targetAmount) * 100),
        )
      : null;

  return (
    <main>
      <PageHeader
        title="Pension"
        subtitle="RSA and other pots in plain language — estimates, not PenCom statements."
        action={
          <Link href="/app/plan" className="btn btn-soft">
            Retirement goal
          </Link>
        }
      />

      <HeroMetric
        label="Pension balance (aggregated)"
        value={formatNaira(intel.totalPensionNgn, true)}
        hint={
          <>
            <Badge>{intel.engineVersion}</Badge>
            <Badge>{intel.pots.length} pots</Badge>
            {intel.currencies.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </>
        }
      />

      <InsightPanel className="mt-4" eyebrow="In simple terms">
        {intel.narrative}
      </InsightPanel>

      <div className="mt-4 grid grid-cols-2 gap-3">
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
          <p className="eyebrow">Goal gap</p>
          <p className="font-display mt-1 text-2xl">
            {intel.fundingGapNgn == null ? "—" : formatNaira(intel.fundingGapNgn, true)}
          </p>
        </Panel>
      </div>

      {retirement ? (
        <section className="action-card mt-4">
          <p className="eyebrow">Retirement timeline</p>
          <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">
            {goals[0]?.name ?? "Retirement goal"}
          </h2>
          <p className="muted mt-1 text-sm">
            Target {formatNaira(retirement.targetAmount, true)} ·{" "}
            {retirement.targetDate.toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            })}
            {intel.yearsToTarget != null
              ? ` · ~${intel.yearsToTarget.toFixed(1)} years on the clock`
              : ""}
          </p>
          {progressTowardGoal != null ? (
            <div className="mt-4">
              <ProgressBar
                value={progressTowardGoal}
                label={`Pension capital vs goal · ${progressTowardGoal}%`}
              />
            </div>
          ) : null}
          <p className="muted mt-3 text-sm">
            Monthly contribution on the goal: {formatNaira(retirement.monthlyContribution, true)}.
            Employer vs employee splits are not always available — we do not invent them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/app/plan/${goals[0]!.id}`} className="btn btn-soft">
              Open goal journey
            </Link>
            <Link href="/app/plan/scenarios" className="btn btn-ghost">
              Scenario modeller
            </Link>
          </div>
        </section>
      ) : (
        <InsightPanel className="mt-4" eyebrow="Next">
          Add a retirement goal to see projected funding and gap against your pension pots.
        </InsightPanel>
      )}

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
        <h2 className="font-display text-xl">Pots</h2>
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
              <article key={p.id} className="asset-tile">
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
              </article>
            ))
          )}
        </div>
      </section>

      <p className="muted mt-4 text-xs">{intel.disclaimer}</p>
    </main>
  );
}
