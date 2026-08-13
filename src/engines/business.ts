/**
 * Business intelligence engine v1.0
 * Private-business concentration, leverage and valuation freshness — not a valuation opinion.
 */

export const BUSINESS_ENGINE_VERSION = "business-1.0";

export type BusinessAssetInput = {
  id: string;
  name: string;
  value: number;
  currency: string;
  ownershipPercent: number;
  lastValuationDate: Date;
  verificationStatus: string;
  confidence: number;
  incomeGenerated?: number;
};

export type BusinessLoanInput = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  ownershipPercent: number;
  interestRate?: number | null;
  monthlyPayment?: number | null;
};

export type BusinessHolding = {
  id: string;
  name: string;
  ownedValueNgn: number;
  monthsSinceValuation: number;
  stale: boolean;
  confidence: number;
  verificationStatus: string;
};

export type BusinessIntelligence = {
  holdings: BusinessHolding[];
  businessValueOwnedNgn: number;
  businessDebtNgn: number;
  netBusinessEquityNgn: number;
  concentrationOfAssets: number;
  weightedConfidence: number;
  staleCount: number;
  highInterestDebtNgn: number;
  incomeDependencyShare: number | null;
  signals: string[];
  narrative: string;
  engineVersion: string;
  disclaimer: string;
};

function monthsSince(date: Date, now: Date): number {
  return Math.max(
    0,
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth()),
  );
}

export function analyseBusiness(
  businesses: BusinessAssetInput[],
  loans: BusinessLoanInput[],
  totalAssetsNgn: number,
  monthlyIncomeNgn: number,
  businessRelatedMonthlyIncomeNgn: number,
  fxToNgn: (currency: string, amount: number) => number,
  now: Date = new Date(),
): BusinessIntelligence {
  const holdings: BusinessHolding[] = businesses.map((b) => {
    const owned = fxToNgn(b.currency, b.value) * (b.ownershipPercent / 100);
    const months = monthsSince(new Date(b.lastValuationDate), now);
    return {
      id: b.id,
      name: b.name,
      ownedValueNgn: owned,
      monthsSinceValuation: months,
      stale: months >= 6 || b.verificationStatus === "STALE",
      confidence: b.confidence,
      verificationStatus: b.verificationStatus,
    };
  });

  const businessValueOwnedNgn = holdings.reduce((s, h) => s + h.ownedValueNgn, 0);
  const businessDebtNgn = loans.reduce(
    (s, l) => s + fxToNgn(l.currency, l.balance) * (l.ownershipPercent / 100),
    0,
  );
  const netBusinessEquityNgn = businessValueOwnedNgn - businessDebtNgn;
  const concentrationOfAssets =
    totalAssetsNgn > 0 ? businessValueOwnedNgn / totalAssetsNgn : 0;
  const highInterestDebtNgn = loans
    .filter((l) => (l.interestRate ?? 0) >= 0.22)
    .reduce(
      (s, l) => s + fxToNgn(l.currency, l.balance) * (l.ownershipPercent / 100),
      0,
    );

  const confWeight = holdings.reduce(
    (acc, h) => ({
      sum: acc.sum + h.ownedValueNgn * h.confidence,
      w: acc.w + h.ownedValueNgn,
    }),
    { sum: 0, w: 0 },
  );
  const weightedConfidence = confWeight.w > 0 ? confWeight.sum / confWeight.w : 0;
  const staleCount = holdings.filter((h) => h.stale).length;
  const incomeDependencyShare =
    monthlyIncomeNgn > 0 ? businessRelatedMonthlyIncomeNgn / monthlyIncomeNgn : null;

  const signals: string[] = [];
  if (holdings.length === 0) {
    signals.push("No private-business assets recorded.");
  }
  if (concentrationOfAssets >= 0.45) {
    signals.push("Business equity dominates recorded assets — personal liquidity buffers matter.");
  }
  if (staleCount > 0) {
    signals.push(`${staleCount} business valuation(s) are stale or marked STALE.`);
  }
  if (highInterestDebtNgn > 0) {
    signals.push("High-interest business debt is present — cash-flow stress can amplify quickly.");
  }
  if (incomeDependencyShare != null && incomeDependencyShare >= 0.5) {
    signals.push("Personal income appears heavily tied to the business.");
  }
  if (weightedConfidence > 0 && weightedConfidence < 0.65) {
    signals.push("Business values carry low confidence — treat equity as directional only.");
  }

  let narrative =
    "Business figures reflect ownership-adjusted book values you entered — not a formal valuation.";
  if (holdings.length === 0) {
    narrative = "Record private-business ownership and facilities to see concentration and leverage.";
  } else if (netBusinessEquityNgn < 0) {
    narrative =
      "Business-linked debt exceeds recorded business equity. Confirm facility balances and ownership.";
  } else if (concentrationOfAssets >= 0.45) {
    narrative =
      "Wealth is concentrated in the operating business. Separating personal emergency liquidity from working capital is often the next control.";
  } else {
    narrative = `Estimated net business equity is about ₦${Math.round(netBusinessEquityNgn).toLocaleString("en-NG")} after linked facilities.`;
  }

  return {
    holdings,
    businessValueOwnedNgn,
    businessDebtNgn,
    netBusinessEquityNgn,
    concentrationOfAssets,
    weightedConfidence,
    staleCount,
    highInterestDebtNgn,
    incomeDependencyShare,
    signals,
    narrative,
    engineVersion: BUSINESS_ENGINE_VERSION,
    disclaimer:
      "Illustrative only. Not a company valuation, credit assessment, or investment recommendation.",
  };
}
