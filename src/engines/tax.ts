/**
 * Tax lite engine v1.0 — Nigeria-first awareness, not filing software.
 * Bands are illustrative simplifications for planning conversations.
 */

export const TAX_ENGINE_VERSION = "tax-lite-1.0";

/** Simplified illustrative annual PIT bands (NGN) for education — not official tables. */
export const ILLUSTRATIVE_PIT_BANDS = [
  { upTo: 300_000, rate: 0.07 },
  { upTo: 600_000, rate: 0.11 },
  { upTo: 1_100_000, rate: 0.15 },
  { upTo: 1_600_000, rate: 0.19 },
  { upTo: 3_200_000, rate: 0.21 },
  { upTo: Infinity, rate: 0.24 },
] as const;

export type TaxIncomeLine = {
  type: string;
  label?: string;
  amount: number;
  currency: string;
  frequency: string;
};

export type TaxLiteResult = {
  annualEmploymentNgn: number;
  annualOtherIncomeNgn: number;
  annualTaxableEstimateNgn: number;
  illustrativePitNgn: number;
  effectiveRate: number;
  withholdingNotes: string[];
  planningFlags: string[];
  narrative: string;
  engineVersion: string;
  disclaimer: string;
};

function toAnnual(amount: number, frequency: string): number {
  if (frequency === "annual" || frequency === "yearly") return amount;
  if (frequency === "weekly") return amount * 52;
  return amount * 12;
}

export function illustrativePit(taxableAnnualNgn: number): number {
  let remaining = Math.max(0, taxableAnnualNgn);
  let tax = 0;
  let prev = 0;
  for (const band of ILLUSTRATIVE_PIT_BANDS) {
    const width = band.upTo === Infinity ? remaining : Math.max(0, band.upTo - prev);
    const slice = Math.min(remaining, width);
    tax += slice * band.rate;
    remaining -= slice;
    prev = band.upTo === Infinity ? prev : band.upTo;
    if (remaining <= 0) break;
  }
  return tax;
}

export function analyseTaxLite(
  incomes: TaxIncomeLine[],
  fxToNgn: (currency: string, amount: number) => number,
  hasInvestmentAssets: boolean,
  hasRentalIncome: boolean,
): TaxLiteResult {
  let annualEmploymentNgn = 0;
  let annualOtherIncomeNgn = 0;

  for (const row of incomes) {
    const annual = fxToNgn(row.currency, toAnnual(row.amount, row.frequency));
    const key = `${row.type} ${row.label ?? ""}`.toLowerCase();
    if (/salary|employ|wage|payroll/.test(key)) annualEmploymentNgn += annual;
    else annualOtherIncomeNgn += annual;
  }

  // Very rough taxable estimate: employment + 70% of other (allowing crude reliefs) — illustrative only
  const reliefProxy = Math.min(annualEmploymentNgn * 0.2, 500_000);
  const annualTaxableEstimateNgn = Math.max(
    0,
    annualEmploymentNgn + annualOtherIncomeNgn - reliefProxy,
  );
  const illustrativePitNgn = illustrativePit(annualTaxableEstimateNgn);
  const gross = annualEmploymentNgn + annualOtherIncomeNgn;
  const effectiveRate = gross > 0 ? illustrativePitNgn / gross : 0;

  const withholdingNotes: string[] = [
    "Bank interest and some investment income may already attract withholding tax at source.",
    "RSA contributions can affect taxable pay — confirm with your employer / PFA, not this screen.",
  ];
  if (hasInvestmentAssets) {
    withholdingNotes.push(
      "Investment products may have different WHT / CIT treatments by vehicle — product sheets matter.",
    );
  }
  if (hasRentalIncome) {
    withholdingNotes.push(
      "Rental income often needs separate tracking from salary PAYE — speak to a tax professional.",
    );
  }

  const planningFlags: string[] = [];
  if (gross <= 0) planningFlags.push("No income recorded — tax view is empty until income is added.");
  if (annualOtherIncomeNgn / Math.max(gross, 1) > 0.35) {
    planningFlags.push("A large share of income is non-salary — PAYE alone may understate obligations.");
  }
  if (effectiveRate > 0.2) {
    planningFlags.push("Illustrative effective rate is relatively high — reliefs and structuring deserve a human review.");
  }
  if (hasRentalIncome || hasInvestmentAssets) {
    planningFlags.push("Property / investment holdings can create filing complexity beyond this lite view.");
  }

  const narrative =
    gross <= 0
      ? "Add income lines to see an illustrative personal-income tax awareness view."
      : `Illustrative annual PIT on a simplified taxable base is about ₦${Math.round(illustrativePitNgn).toLocaleString("en-NG")} (≈ ${(effectiveRate * 100).toFixed(1)}% of recorded gross). This is for conversation only.`;

  return {
    annualEmploymentNgn,
    annualOtherIncomeNgn,
    annualTaxableEstimateNgn,
    illustrativePitNgn,
    effectiveRate,
    withholdingNotes,
    planningFlags,
    narrative,
    engineVersion: TAX_ENGINE_VERSION,
    disclaimer:
      "Not tax advice, not a filing, and not FIRS/LIRS software. Nigerian tax rules change — use a qualified tax adviser for returns and elections.",
  };
}
