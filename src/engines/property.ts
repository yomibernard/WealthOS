/**
 * Property intelligence engine v1.0
 * Concentration, equity, LTV, yield and valuation freshness — illustrative, not appraisal.
 */

export const PROPERTY_ENGINE_VERSION = "property-1.0";

export type PropertyAssetInput = {
  id: string;
  name: string;
  value: number;
  currency: string;
  ownershipPercent: number;
  incomeGenerated?: number;
  lastValuationDate: Date;
  verificationStatus: string;
  confidence: number;
  assetType?: string;
};

export type MortgageInput = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  ownershipPercent: number;
  monthlyPayment?: number | null;
  interestRate?: number | null;
};

export type PropertyHolding = {
  id: string;
  name: string;
  grossValueNgn: number;
  ownedValueNgn: number;
  annualIncomeNgn: number;
  grossYield: number | null;
  monthsSinceValuation: number;
  stale: boolean;
  confidence: number;
  verificationStatus: string;
  assetType: string;
};

export type PropertyIntelligence = {
  holdings: PropertyHolding[];
  propertyValueOwnedNgn: number;
  mortgageBalanceNgn: number;
  equityNgn: number;
  ltv: number | null;
  concentrationOfAssets: number;
  weightedConfidence: number;
  staleCount: number;
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

export function analyseProperty(
  properties: PropertyAssetInput[],
  mortgages: MortgageInput[],
  totalAssetsNgn: number,
  fxToNgn: (currency: string, amount: number) => number,
  now: Date = new Date(),
): PropertyIntelligence {
  const holdings: PropertyHolding[] = properties.map((p) => {
    const gross = fxToNgn(p.currency, p.value);
    const owned = gross * (p.ownershipPercent / 100);
    const annualIncome = fxToNgn(p.currency, p.incomeGenerated ?? 0) * 12;
    const months = monthsSince(new Date(p.lastValuationDate), now);
    const yieldBase = owned > 0 ? annualIncome / owned : null;
    return {
      id: p.id,
      name: p.name,
      grossValueNgn: gross,
      ownedValueNgn: owned,
      annualIncomeNgn: annualIncome,
      grossYield: yieldBase,
      monthsSinceValuation: months,
      stale: months >= 6 || p.verificationStatus === "STALE",
      confidence: p.confidence,
      verificationStatus: p.verificationStatus,
      assetType: p.assetType ?? "property",
    };
  });

  const propertyValueOwnedNgn = holdings.reduce((s, h) => s + h.ownedValueNgn, 0);
  const mortgageBalanceNgn = mortgages.reduce(
    (s, m) => s + fxToNgn(m.currency, m.balance) * (m.ownershipPercent / 100),
    0,
  );
  const equityNgn = propertyValueOwnedNgn - mortgageBalanceNgn;
  const ltv =
    propertyValueOwnedNgn > 0 ? mortgageBalanceNgn / propertyValueOwnedNgn : null;
  const concentrationOfAssets =
    totalAssetsNgn > 0 ? propertyValueOwnedNgn / totalAssetsNgn : 0;

  const confWeight = holdings.reduce(
    (acc, h) => ({
      sum: acc.sum + h.ownedValueNgn * h.confidence,
      w: acc.w + h.ownedValueNgn,
    }),
    { sum: 0, w: 0 },
  );
  const weightedConfidence = confWeight.w > 0 ? confWeight.sum / confWeight.w : 0;
  const staleCount = holdings.filter((h) => h.stale).length;

  const signals: string[] = [];
  if (holdings.length === 0) {
    signals.push("No property holdings recorded in the Wealth Graph.");
  }
  if (concentrationOfAssets >= 0.5) {
    signals.push("Property is a majority of recorded assets — concentration risk is material.");
  } else if (concentrationOfAssets >= 0.35) {
    signals.push("Property is a large share of assets; diversification deserves attention.");
  }
  if (ltv != null && ltv > 0.7) {
    signals.push("Loan-to-value looks elevated against recorded property values.");
  } else if (ltv != null && ltv > 0.5) {
    signals.push("Moderate leverage against property — monitor rates and income resilience.");
  }
  if (staleCount > 0) {
    signals.push(`${staleCount} property valuation(s) look stale (6+ months or marked STALE).`);
  }
  const yielding = holdings.filter((h) => (h.grossYield ?? 0) > 0);
  if (yielding.length > 0) {
    const avg =
      yielding.reduce((s, h) => s + (h.grossYield ?? 0), 0) / yielding.length;
    if (avg < 0.04) {
      signals.push("Implied gross rental yields look low versus typical Nigerian urban benchmarks.");
    }
  }

  let narrative =
    "Property figures are estimates from your Wealth Graph, not formal valuations or conveyancing advice.";
  if (holdings.length === 0) {
    narrative = "Add property assets (and any mortgages) to unlock concentration, equity and yield views.";
  } else if (equityNgn < 0) {
    narrative =
      "Recorded mortgages exceed owned property value. Confirm balances and ownership percentages before planning.";
  } else if (concentrationOfAssets >= 0.5) {
    narrative =
      "Your balance sheet is property-heavy. Liquidity and FX diversification may matter more than chasing another brick purchase.";
  } else {
    narrative = `Estimated property equity is about ₦${Math.round(equityNgn).toLocaleString("en-NG")} after recorded mortgages. Yields and valuations remain assumptions until refreshed.`;
  }

  return {
    holdings,
    propertyValueOwnedNgn,
    mortgageBalanceNgn,
    equityNgn,
    ltv,
    concentrationOfAssets,
    weightedConfidence,
    staleCount,
    signals,
    narrative,
    engineVersion: PROPERTY_ENGINE_VERSION,
    disclaimer:
      "Illustrative only. Not a property appraisal, mortgage offer, or regulated investment advice.",
  };
}
