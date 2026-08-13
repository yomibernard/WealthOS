import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { analyseLending } from "@/engines/lending";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

function toMonthly(amount: number, frequency: string): number {
  if (frequency === "annual" || frequency === "yearly") return amount / 12;
  if (frequency === "weekly") return amount * 4.333;
  return amount;
}

export default async function LendingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().lendingLite) {
    return (
      <main>
        <PageHeader title="Lending awareness" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [liabilities, incomes, rates] = await Promise.all([
    prisma.liability.findMany({ where: { userId: user.id } }),
    prisma.income.findMany({ where: { userId: user.id } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const monthlyIncome = incomes.reduce(
    (s, i) => s + fx(i.currency, toMonthly(i.amount, i.frequency)),
    0,
  );
  const intel = analyseLending(liabilities, monthlyIncome, fx);

  return (
    <main>
      <PageHeader
        title="Lending awareness"
        subtitle="Understand existing debt pressure — WealthOS does not originate loans."
        action={
          <Link href="/app/actions" className="btn btn-soft">
            Next actions
          </Link>
        }
      />

      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge>{intel.engineVersion}</Badge>
          <Badge tone="warn">No loan offers</Badge>
        </div>
        <p className="font-display mt-3 text-4xl">{formatNaira(intel.totalDebtNgn, true)}</p>
        <p className="muted text-sm">Total recorded debt</p>
        <p className="mt-4 leading-relaxed">{intel.narrative}</p>
        <p className="muted mt-3 text-xs">{intel.disclaimer}</p>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Monthly service</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.monthlyDebtServiceNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Debt service ratio</p>
          <p className="font-display mt-1 text-2xl">
            {intel.debtServiceRatio == null
              ? "—"
              : formatPercent(intel.debtServiceRatio * 100, 0)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">High-cost debt</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.highCostDebtNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Facilities</p>
          <p className="font-display mt-1 text-2xl">{intel.facilities.length}</p>
        </Panel>
      </div>

      <Panel className="mt-3">
        <p className="eyebrow">Deferred on purpose</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {intel.deferredCapabilities.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </Panel>

      {intel.signals.length ? (
        <Panel className="mt-3">
          <p className="eyebrow">Signals</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {intel.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <section className="mt-5" aria-labelledby="facilities">
        <h2 id="facilities" className="font-display text-xl">
          Facilities
        </h2>
        <div className="mt-3 space-y-3">
          {intel.facilities.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No liabilities yet.{" "}
                <Link href="/app/wealth/add" className="font-semibold text-accent">
                  Add a liability
                </Link>
              </p>
            </Panel>
          ) : (
            intel.facilities.map((f) => (
              <Panel key={f.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{f.name}</p>
                    <p className="muted text-sm">
                      {f.type.replaceAll("_", " ").toLowerCase()}
                      {f.interestRate != null
                        ? ` · ${(f.interestRate * 100).toFixed(1)}%`
                        : ""}
                      {f.highCost ? " · high cost" : ""}
                    </p>
                  </div>
                  <p className="font-display text-xl">{formatNaira(f.balanceNgn, true)}</p>
                </div>
                <p className="muted mt-2 text-sm">
                  Monthly payment {formatNaira(f.monthlyPaymentNgn, true)}
                </p>
              </Panel>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
