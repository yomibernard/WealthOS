import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { analyseInsurance } from "@/engines/insurance";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

function toAnnual(amount: number, frequency: string): number {
  if (frequency === "annual" || frequency === "yearly") return amount;
  if (frequency === "weekly") return amount * 52;
  return amount * 12;
}

export default async function InsurancePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().insuranceIntel) {
    return (
      <main>
        <PageHeader title="Insurance inventory" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [assets, incomes, household, rates] = await Promise.all([
    prisma.asset.findMany({ where: { userId: user.id, category: "INSURANCE" } }),
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.householdMember.findMany({ where: { userId: user.id } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const annualIncome = incomes.reduce(
    (s, i) => s + fx(i.currency, toAnnual(i.amount, i.frequency)),
    0,
  );
  const hasDependants = household.some((h) => h.dependant);

  const intel = analyseInsurance(assets, annualIncome, fx, hasDependants);

  return (
    <main>
      <PageHeader
        title="Insurance inventory"
        subtitle="What you already hold and where records look thin — not underwriting."
      />

      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge>{intel.engineVersion}</Badge>
          <Badge>{intel.covers.length} policies</Badge>
          {intel.lifeMultipleOfIncome != null && intel.lifeMultipleOfIncome > 0 ? (
            <Badge>
              Life ~{intel.lifeMultipleOfIncome.toFixed(1)}× income
            </Badge>
          ) : null}
        </div>
        <p className="mt-4 leading-relaxed">{intel.narrative}</p>
        <p className="muted mt-3 text-xs">{intel.disclaimer}</p>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Sum assured (recorded)</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.totalSumAssuredNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Annual income (est.)</p>
          <p className="font-display mt-1 text-2xl">{formatNaira(intel.annualIncomeNgn, true)}</p>
        </Panel>
      </div>

      {intel.gaps.length > 0 ? (
        <Panel className="mt-3">
          <p className="eyebrow">Possible gaps in your record</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {intel.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <p className="muted mt-3 text-sm">
            Confirm existing cover before shopping.{" "}
            <Link href="/app/adviser-request" className="font-semibold text-accent">
              Request an adviser
            </Link>{" "}
            for product choice.
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

      <section className="mt-5" aria-labelledby="policies-heading">
        <h2 id="policies-heading" className="font-display text-xl">
          Policies
        </h2>
        <div className="mt-3 space-y-3">
          {intel.covers.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No insurance assets yet.{" "}
                <Link href="/app/wealth/add" className="font-semibold text-accent">
                  Add a policy
                </Link>{" "}
                (category: Insurance). Put sum assured in notes if value is 0.
              </p>
            </Panel>
          ) : (
            intel.covers.map((c) => (
              <Panel key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="muted text-sm">
                      {c.coverType}
                      {c.provider ? ` · ${c.provider}` : ""}
                    </p>
                  </div>
                  <p className="font-display text-xl">
                    {c.sumAssuredNgn == null
                      ? "—"
                      : formatNaira(c.sumAssuredNgn, true)}
                  </p>
                </div>
                {c.notes ? <p className="muted mt-2 text-sm">{c.notes}</p> : null}
                <p className="muted mt-1 text-xs">
                  Confidence {formatPercent(c.confidence * 100, 0)}
                </p>
              </Panel>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
