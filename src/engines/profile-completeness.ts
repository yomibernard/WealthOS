/**
 * Profile completeness engine v1.0
 * Checklist scoring — not a vanity percentage without meaning.
 */

export const PROFILE_COMPLETENESS_VERSION = "profile-completeness-1.0";

export type CompletenessCheckId =
  | "identity"
  | "risk_tolerance"
  | "investment_experience"
  | "liquidity_needs"
  | "risk_profile"
  | "income"
  | "expenses"
  | "assets"
  | "liabilities_reviewed"
  | "goals"
  | "consent_ai"
  | "household"
  | "emergency_signal";

export type CompletenessCheck = {
  id: CompletenessCheckId;
  label: string;
  weight: number;
  done: boolean;
  href: string;
  hint: string;
};

export type CompletenessInput = {
  hasName: boolean;
  hasRiskTolerance: boolean;
  hasInvestmentExperience: boolean;
  hasLiquidityNeeds: boolean;
  hasRiskProfile: boolean;
  incomeCount: number;
  expenseCount: number;
  assetCount: number;
  liabilityCount: number;
  goalCount: number;
  hasAiConsent: boolean;
  householdCount: number;
  hasEmergencyGoalOrCash: boolean;
};

export type CompletenessReport = {
  version: string;
  score: number;
  checks: CompletenessCheck[];
  missing: CompletenessCheck[];
  summary: string;
  nextHref: string | null;
};

const DEFS: Array<{
  id: CompletenessCheckId;
  label: string;
  weight: number;
  href: string;
  hint: string;
  done: (i: CompletenessInput) => boolean;
}> = [
  {
    id: "identity",
    label: "Name on account",
    weight: 5,
    href: "/app/settings",
    hint: "Your display name is set.",
    done: (i) => i.hasName,
  },
  {
    id: "risk_tolerance",
    label: "Risk comfort",
    weight: 10,
    href: "/onboarding/fact-find",
    hint: "Tell us if you lean conservative, balanced, or growth.",
    done: (i) => i.hasRiskTolerance,
  },
  {
    id: "investment_experience",
    label: "Investment experience",
    weight: 8,
    href: "/onboarding/fact-find",
    hint: "Novice / intermediate / experienced helps suitability.",
    done: (i) => i.hasInvestmentExperience,
  },
  {
    id: "liquidity_needs",
    label: "Liquidity needs",
    weight: 8,
    href: "/onboarding/fact-find",
    hint: "How soon you may need cash shapes recommendations.",
    done: (i) => i.hasLiquidityNeeds,
  },
  {
    id: "risk_profile",
    label: "Full risk profile",
    weight: 10,
    href: "/onboarding/fact-find",
    hint: "A structured risk profile strengthens WealthAI answers.",
    done: (i) => i.hasRiskProfile,
  },
  {
    id: "income",
    label: "Income recorded",
    weight: 10,
    href: "/app/cashflow",
    hint: "Add at least one income stream.",
    done: (i) => i.incomeCount > 0,
  },
  {
    id: "expenses",
    label: "Expenses recorded",
    weight: 8,
    href: "/app/cashflow",
    hint: "Core expenses improve emergency-month estimates.",
    done: (i) => i.expenseCount > 0,
  },
  {
    id: "assets",
    label: "Assets in Wealth Graph",
    weight: 12,
    href: "/app/wealth/add",
    hint: "Add cash, investments, property, or pensions you own.",
    done: (i) => i.assetCount > 0,
  },
  {
    id: "liabilities_reviewed",
    label: "Liabilities reviewed",
    weight: 8,
    href: "/app/wealth/add",
    hint: "Add debts or confirm you have none via a note in lending.",
    done: (i) => i.liabilityCount > 0 || i.assetCount > 0,
  },
  {
    id: "goals",
    label: "At least one goal",
    weight: 10,
    href: "/app/plan/new",
    hint: "Goals power funding pulse and next-best actions.",
    done: (i) => i.goalCount > 0,
  },
  {
    id: "consent_ai",
    label: "WealthAI personalisation consent",
    weight: 6,
    href: "/app/consent",
    hint: "Consent is required before personalised AI.",
    done: (i) => i.hasAiConsent,
  },
  {
    id: "household",
    label: "Household context",
    weight: 5,
    href: "/app/household",
    hint: "Add members or dependants if relevant.",
    done: (i) => i.householdCount > 0,
  },
  {
    id: "emergency_signal",
    label: "Emergency buffer signal",
    weight: 10,
    href: "/app/plan/funding",
    hint: "Cash holding or emergency goal improves health scoring.",
    done: (i) => i.hasEmergencyGoalOrCash,
  },
];

export function buildCompletenessReport(input: CompletenessInput): CompletenessReport {
  const checks: CompletenessCheck[] = DEFS.map((d) => ({
    id: d.id,
    label: d.label,
    weight: d.weight,
    done: d.done(input),
    href: d.href,
    hint: d.hint,
  }));

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.done).reduce((s, c) => s + c.weight, 0);
  const score = Math.round((earned / Math.max(totalWeight, 1)) * 100);
  const missing = checks.filter((c) => !c.done);

  let summary = "Your financial profile looks solid enough for directional planning.";
  if (score < 40) {
    summary = "Your profile is still thin — start with income, assets, and risk comfort.";
  } else if (score < 70) {
    summary = "Good progress. Closing the remaining gaps will improve confidence and suitability.";
  } else if (missing.length) {
    summary = "Strong profile. A few optional gaps remain if you want fuller WealthAI context.";
  }

  return {
    version: PROFILE_COMPLETENESS_VERSION,
    score,
    checks,
    missing,
    summary,
    nextHref: missing[0]?.href ?? null,
  };
}
