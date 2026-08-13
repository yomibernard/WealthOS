/**
 * Goal & Digital Twin Lite engine v1.0
 * Scenario modelling with transparent assumptions — ranges, not false certainty.
 */

export const GOAL_ENGINE_VERSION = "goal-1.0";

export type GoalAssumptions = {
  inflationAnnual: number;
  expectedReturnAnnual: number;
  returnVolatility?: number;
};

export const DEFAULT_ASSUMPTIONS: GoalAssumptions = {
  inflationAnnual: 0.15,
  expectedReturnAnnual: 0.12,
  returnVolatility: 0.08,
};

export type GoalModelInput = {
  targetAmount: number;
  targetDate: Date;
  existingAllocation: number;
  monthlyContribution: number;
  assumptions?: GoalAssumptions;
  now?: Date;
};

export type GoalForecast = {
  monthsRemaining: number;
  projectedNominal: number;
  projectedLow: number;
  projectedHigh: number;
  progressPercent: number;
  shortfall: number;
  requiredMonthly: number;
  assumptions: GoalAssumptions;
  engineVersion: string;
  narrative: string;
};

export function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  return Math.max(0, years * 12 + months);
}

/** Future value of lump + annuity */
export function projectGoal(input: GoalModelInput): GoalForecast {
  const assumptions = { ...DEFAULT_ASSUMPTIONS, ...input.assumptions };
  const now = input.now ?? new Date();
  const months = monthsBetween(now, input.targetDate);
  const r = assumptions.expectedReturnAnnual / 12;
  const vol = (assumptions.returnVolatility ?? 0.08) / Math.sqrt(12);

  const fvLump = input.existingAllocation * Math.pow(1 + r, months);
  const fvAnnuity =
    r === 0
      ? input.monthlyContribution * months
      : input.monthlyContribution * ((Math.pow(1 + r, months) - 1) / r);

  const projectedNominal = fvLump + fvAnnuity;
  const lowR = Math.max(-0.99, r - vol);
  const highR = r + vol;
  const projectedLow =
    input.existingAllocation * Math.pow(1 + lowR, months) +
    (lowR === 0
      ? input.monthlyContribution * months
      : input.monthlyContribution * ((Math.pow(1 + lowR, months) - 1) / lowR));
  const projectedHigh =
    input.existingAllocation * Math.pow(1 + highR, months) +
    (highR === 0
      ? input.monthlyContribution * months
      : input.monthlyContribution * ((Math.pow(1 + highR, months) - 1) / highR));

  // Progress based on projected funding vs target
  const fundedRatio = projectedNominal / Math.max(input.targetAmount, 1);
  const progress = Math.min(100, Math.round(fundedRatio * 100));

  const shortfall = Math.max(0, input.targetAmount - projectedNominal);
  const requiredMonthly = requiredContribution(
    input.targetAmount,
    input.existingAllocation,
    months,
    r,
  );

  let narrative =
    "Projection is illustrative and depends on contributions, returns and inflation.";
  if (projectedLow >= input.targetAmount) {
    narrative =
      "Even under a cautious return path, the goal appears reachable with current contributions.";
  } else if (projectedNominal >= input.targetAmount) {
    narrative =
      "The central projection meets the target, but the lower range still shows shortfall risk.";
  } else {
    narrative = `Central projection falls short by about the modelled gap. Raising monthly funding toward ${Math.round(requiredMonthly).toLocaleString("en-NG")} may close it.`;
  }

  return {
    monthsRemaining: months,
    projectedNominal,
    projectedLow,
    projectedHigh,
    progressPercent: progress,
    shortfall,
    requiredMonthly,
    assumptions,
    engineVersion: GOAL_ENGINE_VERSION,
    narrative,
  };
}

export function requiredContribution(
  target: number,
  existing: number,
  months: number,
  monthlyRate: number,
): number {
  if (months <= 0) return Math.max(0, target - existing);
  const fvExisting = existing * Math.pow(1 + monthlyRate, months);
  const need = target - fvExisting;
  if (need <= 0) return 0;
  if (monthlyRate === 0) return need / months;
  return need / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

export type ScenarioOption = {
  id: string;
  label: string;
  netWorthDelta: number;
  liquidityDelta: number;
  debtDelta: number;
  cashFlowMonthlyDelta: number;
  concentrationDelta: number;
  goalImpact: string;
  riskNote: string;
};

export type DecisionScenarioInput = {
  propertyPrice: number;
  cashAvailable: number;
  mortgageRateAnnual: number;
  mortgageTermYears: number;
  rentMonthly: number;
  investReturnAnnual: number;
};

export function comparePropertyDecision(input: DecisionScenarioInput): ScenarioOption[] {
  const down = Math.min(input.cashAvailable, input.propertyPrice);
  const mortgagePrincipal = Math.max(0, input.propertyPrice - down);
  const mRate = input.mortgageRateAnnual / 12;
  const n = input.mortgageTermYears * 12;
  const mortgagePayment =
    mortgagePrincipal === 0
      ? 0
      : (mortgagePrincipal * mRate * Math.pow(1 + mRate, n)) /
        (Math.pow(1 + mRate, n) - 1);

  return [
    {
      id: "A",
      label: "Buy cash",
      netWorthDelta: 0,
      liquidityDelta: -input.propertyPrice,
      debtDelta: 0,
      cashFlowMonthlyDelta: input.rentMonthly,
      concentrationDelta: 25,
      goalImpact: "Locks capital into illiquid property; may delay other goals.",
      riskNote: "High concentration and liquidity risk. Assumptions dominate the outcome.",
    },
    {
      id: "B",
      label: "Take mortgage",
      netWorthDelta: 0,
      liquidityDelta: -down,
      debtDelta: mortgagePrincipal,
      cashFlowMonthlyDelta: input.rentMonthly - mortgagePayment,
      concentrationDelta: 20,
      goalImpact: "Preserves some cash but adds leverage and payment obligation.",
      riskNote: "Interest-rate and income-interruption risk. Not a certainty model.",
    },
    {
      id: "C",
      label: "Continue renting and invest",
      netWorthDelta: input.cashAvailable * input.investReturnAnnual,
      liquidityDelta: 0,
      debtDelta: 0,
      cashFlowMonthlyDelta: -input.rentMonthly,
      concentrationDelta: -5,
      goalImpact: "Keeps flexibility; investable assets may support multiple goals.",
      riskNote: "Investment returns are uncertain; rent may rise. Illustrative only.",
    },
  ];
}

export type TwinShock =
  | { type: "retire_at"; age: number; currentAge: number }
  | { type: "increase_contribution"; monthlyDelta: number }
  | { type: "buy_property"; price: number }
  | { type: "income_gap_months"; months: number; monthlyIncome: number }
  | { type: "education_cost_rise"; percent: number; currentTarget: number };

export function runDigitalTwinLite(
  baseNetWorth: number,
  shock: TwinShock,
  assumptions: GoalAssumptions = DEFAULT_ASSUMPTIONS,
): { headline: string; rangeLow: number; rangeHigh: number; assumptions: GoalAssumptions; caveat: string } {
  const caveat =
    "Scenario ranges are illustrative. They are not guarantees or personalised regulated advice.";

  switch (shock.type) {
    case "retire_at": {
      const years = Math.max(0, shock.age - shock.currentAge);
      const low = baseNetWorth * Math.pow(1 + assumptions.expectedReturnAnnual - 0.05, years);
      const high = baseNetWorth * Math.pow(1 + assumptions.expectedReturnAnnual + 0.03, years);
      return {
        headline: `Retiring at ${shock.age} leaves roughly ${years} accumulation years.`,
        rangeLow: low,
        rangeHigh: high,
        assumptions,
        caveat,
      };
    }
    case "increase_contribution": {
      const years = 10;
      const months = years * 12;
      const r = assumptions.expectedReturnAnnual / 12;
      const extra =
        shock.monthlyDelta * ((Math.pow(1 + r, months) - 1) / r);
      return {
        headline: `Raising contributions by the stated amount for ${years} years.`,
        rangeLow: baseNetWorth + extra * 0.7,
        rangeHigh: baseNetWorth + extra * 1.2,
        assumptions,
        caveat,
      };
    }
    case "buy_property": {
      return {
        headline: "Buying property reallocates liquid wealth into an illiquid asset.",
        rangeLow: baseNetWorth - shock.price * 0.05,
        rangeHigh: baseNetWorth + shock.price * 0.1,
        assumptions,
        caveat,
      };
    }
    case "income_gap_months": {
      const drain = shock.months * shock.monthlyIncome;
      return {
        headline: `A ${shock.months}-month income pause may draw on reserves.`,
        rangeLow: baseNetWorth - drain,
        rangeHigh: baseNetWorth - drain * 0.6,
        assumptions,
        caveat,
      };
    }
    case "education_cost_rise": {
      const newTarget = shock.currentTarget * (1 + shock.percent / 100);
      return {
        headline: `Education costs rising ${shock.percent}% increases the funding need.`,
        rangeLow: newTarget,
        rangeHigh: newTarget * 1.1,
        assumptions,
        caveat,
      };
    }
  }
}
