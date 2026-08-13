/**
 * Lending awareness engine v1.0
 * Debt service and leverage framing — not a loan marketplace or credit decisioning.
 */

export const LENDING_ENGINE_VERSION = "lending-lite-1.0";

export type LendingLiabilityInput = {
  id: string;
  type: string;
  name: string;
  balance: number;
  currency: string;
  ownershipPercent: number;
  interestRate?: number | null;
  monthlyPayment?: number | null;
};

export type LendingIntelligence = {
  facilities: Array<{
    id: string;
    name: string;
    type: string;
    balanceNgn: number;
    monthlyPaymentNgn: number;
    interestRate: number | null;
    highCost: boolean;
  }>;
  totalDebtNgn: number;
  monthlyDebtServiceNgn: number;
  debtServiceRatio: number | null;
  highCostDebtNgn: number;
  byType: { type: string; balanceNgn: number }[];
  signals: string[];
  deferredCapabilities: string[];
  narrative: string;
  engineVersion: string;
  disclaimer: string;
};

export function analyseLending(
  liabilities: LendingLiabilityInput[],
  monthlyIncomeNgn: number,
  fxToNgn: (currency: string, amount: number) => number,
): LendingIntelligence {
  const facilities = liabilities.map((l) => {
    const balanceNgn = fxToNgn(l.currency, l.balance) * (l.ownershipPercent / 100);
    const monthlyPaymentNgn = fxToNgn(l.currency, l.monthlyPayment ?? 0) * (l.ownershipPercent / 100);
    const rate = l.interestRate ?? null;
    return {
      id: l.id,
      name: l.name,
      type: l.type,
      balanceNgn,
      monthlyPaymentNgn,
      interestRate: rate,
      highCost: (rate ?? 0) >= 0.22 || l.type === "CREDIT",
    };
  });

  const totalDebtNgn = facilities.reduce((s, f) => s + f.balanceNgn, 0);
  const monthlyDebtServiceNgn = facilities.reduce((s, f) => s + f.monthlyPaymentNgn, 0);
  const debtServiceRatio =
    monthlyIncomeNgn > 0 ? monthlyDebtServiceNgn / monthlyIncomeNgn : null;
  const highCostDebtNgn = facilities
    .filter((f) => f.highCost)
    .reduce((s, f) => s + f.balanceNgn, 0);

  const byTypeMap = new Map<string, number>();
  for (const f of facilities) {
    byTypeMap.set(f.type, (byTypeMap.get(f.type) ?? 0) + f.balanceNgn);
  }
  const byType = [...byTypeMap.entries()]
    .map(([type, balanceNgn]) => ({ type, balanceNgn }))
    .sort((a, b) => b.balanceNgn - a.balanceNgn);

  const signals: string[] = [];
  if (facilities.length === 0) {
    signals.push("No liabilities recorded — add facilities to see debt-service pressure.");
  }
  if (debtServiceRatio != null && debtServiceRatio >= 0.4) {
    signals.push("Debt service looks heavy versus recorded income (≥40% heuristic).");
  } else if (debtServiceRatio != null && debtServiceRatio >= 0.25) {
    signals.push("Debt service is material versus income — protect surplus before new borrowing.");
  }
  if (highCostDebtNgn > 0) {
    signals.push("High-cost debt is present — often prioritise this before new investing.");
  }
  if (byType.some((t) => t.type === "BUSINESS_LOAN") && byType.some((t) => t.type === "PERSONAL_LOAN" || t.type === "CREDIT")) {
    signals.push("Personal and business facilities both appear — keep guarantees and cash buffers distinct.");
  }

  const deferredCapabilities = [
    "Loan origination / instant offers",
    "Credit score pulls",
    "BNPL or payday products",
    "Automatic refinance execution",
    "Guaranteed approval messaging",
  ];

  const narrative =
    facilities.length === 0
      ? "Lending products are not sold here. Record existing debt to understand pressure versus income."
      : `Recorded debt is about ₦${Math.round(totalDebtNgn).toLocaleString("en-NG")} with monthly service ≈ ₦${Math.round(monthlyDebtServiceNgn).toLocaleString("en-NG")}. WealthOS explains; it does not underwrite new loans.`;

  return {
    facilities,
    totalDebtNgn,
    monthlyDebtServiceNgn,
    debtServiceRatio,
    highCostDebtNgn,
    byType,
    signals,
    deferredCapabilities,
    narrative,
    engineVersion: LENDING_ENGINE_VERSION,
    disclaimer:
      "Not a credit decision, loan offer, or debt counselling licence. Suitability and affordability for new borrowing require a human lender/adviser.",
  };
}
