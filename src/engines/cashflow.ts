/**
 * Cash-flow intelligence engine v1.0
 * Deterministic monthly surplus / deficit from income and expenses.
 */

export const CASHFLOW_ENGINE_VERSION = "cashflow-1.0";

export type CashflowLine = {
  amount: number;
  currency: string;
  frequency: string;
  label?: string;
  category?: string;
};

export type CashflowResult = {
  monthlyIncomeNgn: number;
  monthlyExpenseNgn: number;
  monthlySurplusNgn: number;
  savingsRate: number;
  largestExpenseShare: number;
  largestExpenseCategory: string | null;
  status: "surplus" | "tight" | "deficit";
  narrative: string;
  engineVersion: string;
};

function toMonthly(amount: number, frequency: string): number {
  if (frequency === "annual" || frequency === "yearly") return amount / 12;
  if (frequency === "weekly") return amount * 4.333;
  return amount;
}

export function analyseCashflow(
  incomes: CashflowLine[],
  expenses: CashflowLine[],
  fxToNgn: (currency: string, amount: number) => number,
): CashflowResult {
  const monthlyIncomeNgn = incomes.reduce(
    (s, i) => s + fxToNgn(i.currency, toMonthly(i.amount, i.frequency)),
    0,
  );
  const monthlyExpenseNgn = expenses.reduce(
    (s, e) => s + fxToNgn(e.currency, toMonthly(e.amount, e.frequency)),
    0,
  );
  const monthlySurplusNgn = monthlyIncomeNgn - monthlyExpenseNgn;
  const savingsRate = monthlyIncomeNgn > 0 ? monthlySurplusNgn / monthlyIncomeNgn : 0;

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const key = e.category || e.label || "other";
    byCategory.set(key, (byCategory.get(key) ?? 0) + fxToNgn(e.currency, toMonthly(e.amount, e.frequency)));
  }
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  const largestExpenseCategory = top?.[0] ?? null;
  const largestExpenseShare =
    monthlyExpenseNgn > 0 && top ? top[1] / monthlyExpenseNgn : 0;

  let status: CashflowResult["status"] = "surplus";
  if (monthlySurplusNgn < 0) status = "deficit";
  else if (savingsRate < 0.1) status = "tight";

  const narrative =
    status === "deficit"
      ? "Monthly outgoings currently exceed income. Stabilising cash flow should precede new investing."
      : status === "tight"
        ? "You are close to break-even. Building a clearer surplus would strengthen emergency and goal funding."
        : "You appear to run a monthly surplus. Confirm that surplus is intentionally allocated to liquidity or goals.";

  return {
    monthlyIncomeNgn,
    monthlyExpenseNgn,
    monthlySurplusNgn,
    savingsRate,
    largestExpenseShare,
    largestExpenseCategory,
    status,
    narrative,
    engineVersion: CASHFLOW_ENGINE_VERSION,
  };
}
