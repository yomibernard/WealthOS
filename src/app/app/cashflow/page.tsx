import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
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

  return (
    <main>
      <PageHeader
        title="Cash-flow intelligence"
        subtitle="Monthly surplus or pressure — before product suggestions."
      />
      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge
            tone={
              cf.status === "deficit" ? "danger" : cf.status === "tight" ? "warn" : "default"
            }
          >
            {cf.status}
          </Badge>
          <Badge>{cf.engineVersion}</Badge>
        </div>
        <p className="font-display mt-3 text-4xl">
          {formatNaira(cf.monthlySurplusNgn, true)}
        </p>
        <p className="muted text-sm">Estimated monthly surplus / deficit</p>
        <p className="mt-4 leading-relaxed">{cf.narrative}</p>
      </Panel>
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
        {cf.largestExpenseCategory ? (
          <p className="muted mt-2 text-sm">
            Largest expense category: {cf.largestExpenseCategory} (
            {formatPercent(cf.largestExpenseShare * 100, 0)} of outgoings)
          </p>
        ) : null}
      </Panel>
    </main>
  );
}
