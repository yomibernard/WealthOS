/**
 * Insurance inventory engine v1.0
 * Coverage inventory and gap signals — never underwriting, pricing, or "buy this policy".
 */

export const INSURANCE_ENGINE_VERSION = "insurance-1.0";

export type InsuranceAssetInput = {
  id: string;
  name: string;
  assetType: string;
  provider?: string | null;
  value: number;
  currency: string;
  notes?: string | null;
  verificationStatus: string;
  confidence: number;
};

export type InsuranceCover = {
  id: string;
  name: string;
  coverType: string;
  provider: string | null;
  sumAssuredNgn: number | null;
  verificationStatus: string;
  confidence: number;
  notes: string | null;
};

export type InsuranceIntelligence = {
  covers: InsuranceCover[];
  coverTypesPresent: string[];
  totalSumAssuredNgn: number;
  annualIncomeNgn: number;
  lifeMultipleOfIncome: number | null;
  gaps: string[];
  signals: string[];
  narrative: string;
  engineVersion: string;
  disclaimer: string;
};

const TYPE_ALIASES: Record<string, string> = {
  life: "life",
  term: "life",
  "whole life": "life",
  health: "health",
  medical: "health",
  hmo: "health",
  critical: "critical_illness",
  "critical illness": "critical_illness",
  disability: "disability",
  income: "disability",
  property: "property",
  home: "property",
  motor: "motor",
  auto: "motor",
  travel: "travel",
};

export function normalizeCoverType(assetType: string, name: string): string {
  const raw = `${assetType} ${name}`.toLowerCase();
  for (const [key, value] of Object.entries(TYPE_ALIASES)) {
    if (raw.includes(key)) return value;
  }
  return assetType.toLowerCase() || "other";
}

/** Parse sum assured from notes like "Sum assured ₦50m" or "50000000". */
export function parseSumAssured(notes: string | null | undefined, assetValue: number): number | null {
  if (assetValue > 0) return assetValue;
  if (!notes) return null;
  const m = notes.match(
    /(?:sum\s*assured|cover(?:age)?|benefit)[:\s]*₦?\s*([\d,.]+)\s*(m|bn|million|billion)?/i,
  );
  if (!m) {
    const plain = notes.match(/₦\s*([\d,.]+)\s*(m|bn)?/i);
    if (!plain) return null;
    let n = parseFloat(plain[1].replace(/,/g, ""));
    if (Number.isNaN(n)) return null;
    const unit = (plain[2] || "").toLowerCase();
    if (unit === "m") n *= 1_000_000;
    if (unit === "bn") n *= 1_000_000_000;
    return n;
  }
  let n = parseFloat(m[1].replace(/,/g, ""));
  if (Number.isNaN(n)) return null;
  const unit = (m[2] || "").toLowerCase();
  if (unit === "m" || unit === "million") n *= 1_000_000;
  if (unit === "bn" || unit === "billion") n *= 1_000_000_000;
  return n;
}

export function analyseInsurance(
  policies: InsuranceAssetInput[],
  annualIncomeNgn: number,
  fxToNgn: (currency: string, amount: number) => number,
  hasDependants = false,
): InsuranceIntelligence {
  const covers: InsuranceCover[] = policies.map((p) => {
    const parsed = parseSumAssured(p.notes, fxToNgn(p.currency, p.value));
    return {
      id: p.id,
      name: p.name,
      coverType: normalizeCoverType(p.assetType, p.name),
      provider: p.provider ?? null,
      sumAssuredNgn: parsed,
      verificationStatus: p.verificationStatus,
      confidence: p.confidence,
      notes: p.notes ?? null,
    };
  });

  const coverTypesPresent = [...new Set(covers.map((c) => c.coverType))];
  const totalSumAssuredNgn = covers.reduce((s, c) => s + (c.sumAssuredNgn ?? 0), 0);
  const lifeSum = covers
    .filter((c) => c.coverType === "life")
    .reduce((s, c) => s + (c.sumAssuredNgn ?? 0), 0);
  const lifeMultipleOfIncome =
    annualIncomeNgn > 0 && lifeSum > 0 ? lifeSum / annualIncomeNgn : lifeSum > 0 ? null : 0;

  const gaps: string[] = [];
  const signals: string[] = [];

  if (covers.length === 0) {
    gaps.push("No insurance policies recorded in the Wealth Graph.");
  }
  if (!coverTypesPresent.includes("life") && (hasDependants || annualIncomeNgn > 0)) {
    gaps.push("No life cover recorded — especially relevant if others rely on your income.");
  }
  if (!coverTypesPresent.includes("health")) {
    gaps.push("No health / HMO cover recorded.");
  }
  if (!coverTypesPresent.includes("critical_illness") && annualIncomeNgn > 5_000_000) {
    gaps.push("No critical-illness cover recorded for a relatively high income profile.");
  }
  if (!coverTypesPresent.includes("property")) {
    signals.push("If you hold property, check whether buildings/contents cover is recorded.");
  }
  if (lifeMultipleOfIncome != null && lifeMultipleOfIncome > 0 && lifeMultipleOfIncome < 5) {
    signals.push(
      "Recorded life cover is under ~5× annual income — a common planning heuristic, not a rule.",
    );
  } else if (lifeMultipleOfIncome != null && lifeMultipleOfIncome >= 5) {
    signals.push("Recorded life cover is at or above ~5× annual income (heuristic only).");
  }
  if (covers.some((c) => c.sumAssuredNgn == null)) {
    signals.push("Some policies lack a clear sum assured — add it in notes for better gap analysis.");
  }

  let narrative =
    "This is an inventory and gap checklist, not underwriting or a recommendation to buy a product.";
  if (covers.length === 0) {
    narrative =
      "Record existing policies (life, health, property) to see coverage gaps before shopping for new products.";
  } else if (gaps.length >= 2) {
    narrative =
      "Several coverage types appear missing from your record. Confirm what you already hold before changing anything — and speak with a licensed adviser for product choice.";
  } else {
    narrative = `You have ${covers.length} policy record(s) across ${coverTypesPresent.length} cover type(s). Review gaps with a human adviser before acting.`;
  }

  return {
    covers,
    coverTypesPresent,
    totalSumAssuredNgn,
    annualIncomeNgn,
    lifeMultipleOfIncome,
    gaps,
    signals,
    narrative,
    engineVersion: INSURANCE_ENGINE_VERSION,
    disclaimer:
      "Not insurance advice, underwriting, or a product solicitation. Suitability and disclosure remain human-governed.",
  };
}
