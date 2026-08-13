/**
 * Pension aggregation engine v1.0
 * RSA + foreign pensions — illustrative, not a PenCom statement or advice.
 */

export const PENSION_ENGINE_VERSION = "pension-1.0";

export type PensionAssetInput = {
  id: string;
  name: string;
  assetType: string;
  provider?: string | null;
  value: number;
  currency: string;
  ownershipPercent: number;
  lastValuationDate: Date;
  verificationStatus: string;
  confidence: number;
  country?: string;
};

export type RetirementGoalInput = {
  targetAmount: number;
  targetDate: Date;
  existingAllocation: number;
  monthlyContribution: number;
} | null;

export type PensionPot = {
  id: string;
  name: string;
  kind: "rsa" | "foreign" | "other";
  ownedValueNgn: number;
  currency: string;
  provider: string | null;
  monthsSinceValuation: number;
  stale: boolean;
  confidence: number;
};

export type PensionIntelligence = {
  pots: PensionPot[];
  totalPensionNgn: number;
  rsaNgn: number;
  foreignNgn: number;
  concentrationOfAssets: number;
  weightedConfidence: number;
  staleCount: number;
  currencies: string[];
  yearsToTarget: number | null;
  fundingGapNgn: number | null;
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

function classifyKind(assetType: string, name: string, currency: string): PensionPot["kind"] {
  const raw = `${assetType} ${name}`.toLowerCase();
  if (raw.includes("rsa") || raw.includes("pencom") || (currency === "NGN" && raw.includes("pension")))
    return "rsa";
  if (currency !== "NGN" || raw.includes("uk") || raw.includes("us") || raw.includes("foreign"))
    return "foreign";
  return "other";
}

export function analysePension(
  pensions: PensionAssetInput[],
  totalAssetsNgn: number,
  retirementGoal: RetirementGoalInput,
  fxToNgn: (currency: string, amount: number) => number,
  now: Date = new Date(),
): PensionIntelligence {
  const pots: PensionPot[] = pensions.map((p) => {
    const owned = fxToNgn(p.currency, p.value) * (p.ownershipPercent / 100);
    const months = monthsSince(new Date(p.lastValuationDate), now);
    return {
      id: p.id,
      name: p.name,
      kind: classifyKind(p.assetType, p.name, p.currency),
      ownedValueNgn: owned,
      currency: p.currency,
      provider: p.provider ?? null,
      monthsSinceValuation: months,
      stale: months >= 6 || p.verificationStatus === "STALE",
      confidence: p.confidence,
    };
  });

  const totalPensionNgn = pots.reduce((s, p) => s + p.ownedValueNgn, 0);
  const rsaNgn = pots.filter((p) => p.kind === "rsa").reduce((s, p) => s + p.ownedValueNgn, 0);
  const foreignNgn = pots.filter((p) => p.kind === "foreign").reduce((s, p) => s + p.ownedValueNgn, 0);
  const concentrationOfAssets = totalAssetsNgn > 0 ? totalPensionNgn / totalAssetsNgn : 0;
  const staleCount = pots.filter((p) => p.stale).length;
  const currencies = [...new Set(pots.map((p) => p.currency))];

  const confWeight = pots.reduce(
    (acc, p) => ({
      sum: acc.sum + p.ownedValueNgn * p.confidence,
      w: acc.w + p.ownedValueNgn,
    }),
    { sum: 0, w: 0 },
  );
  const weightedConfidence = confWeight.w > 0 ? confWeight.sum / confWeight.w : 0;

  let yearsToTarget: number | null = null;
  let fundingGapNgn: number | null = null;
  if (retirementGoal) {
    const ms = retirementGoal.targetDate.getTime() - now.getTime();
    yearsToTarget = Math.max(0, ms / (365.25 * 24 * 60 * 60 * 1000));
    const months = yearsToTarget * 12;
    const r = 0.1 / 12; // cautious illustrative RSA-like path — not a guarantee
    const fvExisting = totalPensionNgn * Math.pow(1 + r, months);
    const fvContrib =
      r === 0
        ? retirementGoal.monthlyContribution * months
        : retirementGoal.monthlyContribution * ((Math.pow(1 + r, months) - 1) / r);
    const projected = fvExisting + fvContrib;
    fundingGapNgn = Math.max(0, retirementGoal.targetAmount - projected);
  }

  const signals: string[] = [];
  if (pots.length === 0) {
    signals.push("No pension pots recorded — add RSA or foreign workplace pensions.");
  }
  if (staleCount > 0) {
    signals.push(`${staleCount} pension valuation(s) look stale.`);
  }
  if (foreignNgn > 0 && rsaNgn > 0) {
    signals.push("You hold both Nigerian RSA and foreign pension — FX and access rules differ.");
  } else if (foreignNgn > 0) {
    signals.push("Foreign pension recorded — confirm transfer / access rules before relying on it.");
  }
  if (fundingGapNgn != null && fundingGapNgn > 0) {
    signals.push("Illustrative retirement funding still shows a gap versus your stated target.");
  } else if (fundingGapNgn === 0 && retirementGoal) {
    signals.push("Under a cautious illustrative path, pension + contributions may meet the target.");
  }
  if (concentrationOfAssets >= 0.35) {
    signals.push("Pension is a large share of recorded assets — keep liquidity separate for shocks.");
  }

  let narrative =
    "Pension figures are Wealth Graph estimates, not PenCom or overseas scheme statements.";
  if (pots.length === 0) {
    narrative = "Add RSA and any diaspora workplace pensions to see aggregated retirement capital.";
  } else if (fundingGapNgn != null && fundingGapNgn > 0) {
    narrative = `Aggregated pension is about ₦${Math.round(totalPensionNgn).toLocaleString("en-NG")}. An illustrative path still leaves a funding gap versus your retirement goal.`;
  } else {
    narrative = `Aggregated pension capital is about ₦${Math.round(totalPensionNgn).toLocaleString("en-NG")} across ${pots.length} pot(s).`;
  }

  return {
    pots,
    totalPensionNgn,
    rsaNgn,
    foreignNgn,
    concentrationOfAssets,
    weightedConfidence,
    staleCount,
    currencies,
    yearsToTarget,
    fundingGapNgn,
    signals,
    narrative,
    engineVersion: PENSION_ENGINE_VERSION,
    disclaimer:
      "Illustrative only. Not a PenCom statement, transfer advice, or guaranteed retirement outcome.",
  };
}
