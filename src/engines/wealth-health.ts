/**
 * Wealth Health Score Engine v1.0
 * Configurable, versioned dimensions. Scores 0–100.
 */

export const WEALTH_HEALTH_VERSION = "health-1.0";

export type HealthWeights = {
  liquidity: number;
  savings: number;
  debt: number;
  diversification: number;
  goalReadiness: number;
  protection: number;
  retirement: number;
  estate: number;
};

export const DEFAULT_HEALTH_WEIGHTS: HealthWeights = {
  liquidity: 0.15,
  savings: 0.1,
  debt: 0.15,
  diversification: 0.15,
  goalReadiness: 0.15,
  protection: 0.1,
  retirement: 0.1,
  estate: 0.1,
};

export type HealthInput = {
  liquidAssetsNgn: number;
  monthlyExpensesNgn: number;
  monthlySavingsNgn: number;
  monthlyIncomeNgn: number;
  totalDebtNgn: number;
  totalAssetsNgn: number;
  largestAssetClassPercent: number;
  goalProgressAvg: number;
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  retirementAllocationNgn: number;
  retirementTargetNgn: number;
  hasBeneficiaryInfo: boolean;
  hasEstateDocs: boolean;
  dataCoverage: number; // 0–1
};

export type DimensionResult = {
  key: keyof HealthWeights;
  label: string;
  score: number;
  weight: number;
  reason: string;
};

export type HealthResult = {
  overall: number;
  dimensions: DimensionResult[];
  coverage: number;
  confidence: number;
  version: string;
  improvementLevers: string[];
};

export function calculateWealthHealth(
  input: HealthInput,
  weights: HealthWeights = DEFAULT_HEALTH_WEIGHTS,
): HealthResult {
  const dimensions: DimensionResult[] = [
    scoreLiquidity(input, weights.liquidity),
    scoreSavings(input, weights.savings),
    scoreDebt(input, weights.debt),
    scoreDiversification(input, weights.diversification),
    scoreGoals(input, weights.goalReadiness),
    scoreProtection(input, weights.protection),
    scoreRetirement(input, weights.retirement),
    scoreEstate(input, weights.estate),
  ];

  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0),
  );

  const confidence = Math.round(input.dataCoverage * (0.7 + 0.3 * (overall / 100)) * 100) / 100;

  const improvementLevers = dimensions
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d) => d.reason);

  return {
    overall: Math.max(0, Math.min(100, overall)),
    dimensions,
    coverage: input.dataCoverage,
    confidence,
    version: WEALTH_HEALTH_VERSION,
    improvementLevers,
  };
}

function scoreLiquidity(input: HealthInput, weight: number): DimensionResult {
  const months =
    input.monthlyExpensesNgn > 0 ? input.liquidAssetsNgn / input.monthlyExpensesNgn : 0;
  let score = 20;
  let reason = "Emergency liquidity is below target.";
  if (months >= 6) {
    score = 95;
    reason = "Emergency reserve covers 6+ months of expenses.";
  } else if (months >= 3) {
    score = 75;
    reason = "Emergency reserve covers 3–6 months; building toward 6 is prudent.";
  } else if (months >= 1) {
    score = 45;
    reason = "Emergency liquidity is below the 3-month target.";
  }
  return { key: "liquidity", label: "Liquidity", score, weight, reason };
}

function scoreSavings(input: HealthInput, weight: number): DimensionResult {
  const rate =
    input.monthlyIncomeNgn > 0 ? input.monthlySavingsNgn / input.monthlyIncomeNgn : 0;
  let score = 25;
  let reason = "Savings rate is low relative to income.";
  if (rate >= 0.25) {
    score = 90;
    reason = "Strong savings behaviour relative to income.";
  } else if (rate >= 0.15) {
    score = 70;
    reason = "Solid savings rate; consistency matters more than spikes.";
  } else if (rate >= 0.05) {
    score = 45;
    reason = "Some saving occurs, but the rate may underfund long-term goals.";
  }
  return { key: "savings", label: "Savings behaviour", score, weight, reason };
}

function scoreDebt(input: HealthInput, weight: number): DimensionResult {
  const ratio = input.totalAssetsNgn > 0 ? input.totalDebtNgn / input.totalAssetsNgn : 1;
  let score = 30;
  let reason = "Debt levels are elevated relative to assets.";
  if (input.totalDebtNgn <= 0) {
    score = 95;
    reason = "No material personal debt recorded.";
  } else if (ratio < 0.2) {
    score = 85;
    reason = "Debt is modest relative to assets.";
  } else if (ratio < 0.4) {
    score = 60;
    reason = "Manageable debt; prioritise high-interest balances.";
  }
  return { key: "debt", label: "Debt health", score, weight, reason };
}

function scoreDiversification(input: HealthInput, weight: number): DimensionResult {
  const conc = input.largestAssetClassPercent;
  let score = 35;
  let reason = `Concentration is high (${conc.toFixed(0)}% in one asset class).`;
  if (conc <= 35) {
    score = 90;
    reason = "Wealth is reasonably diversified across asset classes.";
  } else if (conc <= 50) {
    score = 65;
    reason = "Moderate concentration; further diversification may reduce risk.";
  } else if (conc <= 65) {
    score = 45;
    reason = `Property or a single class represents ${conc.toFixed(0)}% of estimated wealth.`;
  }
  return { key: "diversification", label: "Diversification", score, weight, reason };
}

function scoreGoals(input: HealthInput, weight: number): DimensionResult {
  const p = input.goalProgressAvg;
  const score = Math.round(Math.max(10, Math.min(95, p)));
  let reason = "Goal funding is underway; some targets need more contribution.";
  if (p >= 80) reason = "Goals are largely on track based on current allocations.";
  else if (p < 40) reason = "Several goals appear underfunded relative to targets.";
  return { key: "goalReadiness", label: "Goal readiness", score, weight, reason };
}

function scoreProtection(input: HealthInput, weight: number): DimensionResult {
  let score = 20;
  if (input.hasLifeInsurance && input.hasHealthInsurance) score = 90;
  else if (input.hasLifeInsurance || input.hasHealthInsurance) score = 55;
  const reason =
    score >= 90
      ? "Core life and health protection appear in place."
      : score >= 55
        ? "Partial protection recorded; review coverage gaps."
        : "Little or no insurance protection recorded.";
  return { key: "protection", label: "Protection", score, weight, reason };
}

function scoreRetirement(input: HealthInput, weight: number): DimensionResult {
  const ratio =
    input.retirementTargetNgn > 0
      ? input.retirementAllocationNgn / input.retirementTargetNgn
      : 0;
  const score = Math.round(Math.max(15, Math.min(95, ratio * 100)));
  const reason =
    ratio >= 0.7
      ? "Retirement assets are progressing toward the modelled need."
      : "Retirement funding may need higher contributions or a longer horizon.";
  return { key: "retirement", label: "Retirement", score, weight, reason };
}

function scoreEstate(input: HealthInput, weight: number): DimensionResult {
  let score = 20;
  if (input.hasBeneficiaryInfo && input.hasEstateDocs) score = 80;
  else if (input.hasBeneficiaryInfo || input.hasEstateDocs) score = 45;
  const reason =
    score >= 80
      ? "Basic estate readiness items are recorded."
      : "Estate preparedness is limited — beneficiaries and key documents need attention.";
  return { key: "estate", label: "Estate preparedness", score, weight, reason };
}
