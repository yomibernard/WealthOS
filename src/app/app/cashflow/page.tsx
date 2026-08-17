import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, HeroMetric, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { analyseCashflow } from "@/engines/cashflow";
import { convertAmount } from "@/engines/fx";
import { formatNaira, formatPercent } from "@/lib/format";

export default async function CashflowPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const [incomes, expenses, rates] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.expense.findMany({ where: { userId: user.id } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const cf = analyseCashflow(incomes, expenses, fx);
  const scale = Math.max(cf.monthlyIncomeNgn, cf.monthlyExpenseNgn, 1);
  const incomePct = Math.min(100, (cf.monthlyIncomeNgn / scale) * 100);
  const expensePct = Math.min(100, (cf.monthlyExpenseNgn / scale) * 100);
  const surplusPct =
    cf.monthlySurplusNgn > 0
      ? Math.min(100, (cf.monthlySurplusNgn / scale) * 100)
      : 0;

  const expenseBuckets = new Map<string, number>();
  for (const e of expenses) {
    const key = (e.category || e.label || "Living costs").toString();
    const monthly =
      e.frequency === "annual" || e.frequency === "yearly"
        ? e.amount / 12
        : e.frequency === "weekly"
          ? e.amount * 4.333
          : e.amount;
    expenseBuckets.set(key, (expenseBuckets.get(key) ?? 0) + fx(e.currency, monthly));
  }
  const topExpenses = [...expenseBuckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const insight =
    cf.status === "deficit"
      ? "Outgoings are running ahead of income this month — stabilise cash flow before new products."
      : cf.status === "tight"
        ? "Spending is close to income. A clearer surplus would strengthen emergency and goal funding."
        : cf.largestExpenseCategory
          ? `${cf.largestExpenseCategory} is your largest outflow (~${formatPercent(cf.largestExpenseShare * 100, 0)} of expenses).`
          : "You appear to run a monthly surplus — confirm it is allocated on purpose.";

  return (
    <main>
      <PageHeader
        title="Cash flow"
        subtitle="Where money comes from and where it goes — diagnosis before products."
      />

      <HeroMetric
        label="Estimated monthly surplus / deficit"
        value={formatNaira(cf.monthlySurplusNgn, true)}
        hint={
          <>
            <Badge
              tone={
                cf.status === "deficit" ? "danger" : cf.status === "tight" ? "warn" : "default"
              }
            >
              {cf.status}
            </Badge>
            <Badge>{cf.engineVersion}</Badge>
          </>
        }
      />

      <InsightPanel className="mt-4" eyebrow="Insight">
        {insight}
      </InsightPanel>

      <section className="action-card mt-4 space-y-4">
        <p className="eyebrow">Financial flow</p>
        <p className="muted text-sm">
          Simplified flow (not a full Sankey). Bars are scaled to the larger of income or expenses.
        </p>

        <div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Income</span>
            <span>{formatNaira(cf.monthlyIncomeNgn, true)}</span>
          </div>
          <div className="wealth-bar-track mt-1.5" aria-hidden>
            <div className="wealth-bar-fill" style={{ width: `${incomePct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Living costs & commitments</span>
            <span>{formatNaira(cf.monthlyExpenseNgn, true)}</span>
          </div>
          <div className="wealth-bar-track mt-1.5" aria-hidden>
            <div
              className="wealth-waterfall-fill is-neg"
              style={{ width: `${expensePct}%`, height: "100%" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold">
              {cf.monthlySurplusNgn >= 0 ? "Available for savings / investments" : "Shortfall"}
            </span>
            <span>{formatNaira(Math.abs(cf.monthlySurplusNgn), true)}</span>
          </div>
          <div className="wealth-bar-track mt-1.5" aria-hidden>
            <div
              className={
                cf.monthlySurplusNgn >= 0 ? "wealth-bar-fill" : "wealth-waterfall-fill is-neg"
              }
              style={{
                width: `${cf.monthlySurplusNgn >= 0 ? surplusPct : expensePct}%`,
                height: "100%",
              }}
            />
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Income</p>
          <p className="font-display mt-1 text-2xl">{formatNaira(cf.monthlyIncomeNgn, true)}</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Expenses</p>
          <p className="font-display mt-1 text-2xl">{formatNaira(cf.monthlyExpenseNgn, true)}</p>
        </Panel>
      </div>

      <Panel className="mt-3">
        <p className="eyebrow">Savings rate</p>
        <p className="font-display mt-1 text-3xl">{formatPercent(cf.savingsRate * 100, 0)}</p>
        <p className="muted mt-2 text-sm leading-relaxed">{cf.narrative}</p>
      </Panel>

      {topExpenses.length ? (
        <section className="mt-5">
          <h2 className="font-display text-xl">Outflow mix</h2>
          <ul className="mt-3 space-y-3">
            {topExpenses.map(([label, value]) => {
              const pct = cf.monthlyExpenseNgn > 0 ? (value / cf.monthlyExpenseNgn) * 100 : 0;
              return (
                <li key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold">{label}</span>
                    <span>
                      {formatPercent(pct, 0)} · {formatNaira(value, true)}
                    </span>
                  </div>
                  <div className="wealth-bar-track" aria-hidden>
                    <div className="wealth-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/actions" className="btn btn-soft">
          Next-best actions
        </Link>
        <Link href="/app/ai" className="btn btn-ghost">
          Ask WealthAI
        </Link>
      </div>
    </main>
  );
}
