/**
 * Next Best Financial Action engine v1.0
 * Can recommend no transaction. Ranking is not revenue-driven.
 */

export const NBFA_VERSION = "nbfa-1.0";

export type ActionCandidate = {
  actionType: string;
  title: string;
  what: string;
  amount?: number;
  amountCurrency?: string;
  why: string;
  goalLink?: string;
  risks: string;
  liquidityNote?: string;
  costsNote?: string;
  alternatives: string[];
  providerNote?: string;
  regulatoryStatus?: string;
  assumptions: Record<string, unknown>;
  scores: {
    financialImpact: number;
    urgency: number;
    riskReduction: number;
    goalImpact: number;
    liquidity: number;
    preference: number;
    suitability: number;
    dataConfidence: number;
    vulnerabilityCare: number;
  };
};

export type ScoredAction = ActionCandidate & {
  score: number;
  confidence: number;
};

export type NbfaContext = {
  emergencyMonths: number;
  propertyPercent: number;
  idleCashNgn: number;
  highInterestDebtNgn: number;
  staleAssetCount: number;
  hasLifeInsurance: boolean;
  goalUnderfundedCount: number;
  ngnExposurePercent: number;
  vulnerableFlag: boolean;
  dataConfidence: number;
};

const WEIGHTS = {
  financialImpact: 0.18,
  urgency: 0.16,
  riskReduction: 0.16,
  goalImpact: 0.12,
  liquidity: 0.1,
  preference: 0.06,
  suitability: 0.12,
  dataConfidence: 0.06,
  vulnerabilityCare: 0.04,
};

export function generateCandidates(ctx: NbfaContext): ActionCandidate[] {
  const candidates: ActionCandidate[] = [];

  candidates.push({
    actionType: "DO_NOTHING",
    title: "No material action required right now",
    what: "Maintain current allocations and review after the next valuation cycle.",
    why: "When no gap is urgent and data quality is stable, inaction can be the prudent choice.",
    risks: "Delayed response if a new material risk emerges between reviews.",
    alternatives: ["Schedule a 30-day check-in", "Update stale valuations"],
    assumptions: { basis: "No P0 gaps detected" },
    scores: {
      financialImpact: 20,
      urgency: 10,
      riskReduction: 15,
      goalImpact: 20,
      liquidity: 50,
      preference: 60,
      suitability: 90,
      dataConfidence: ctx.dataConfidence * 100,
      vulnerabilityCare: ctx.vulnerableFlag ? 80 : 50,
    },
  });

  if (ctx.emergencyMonths < 3) {
    const gapMonths = Math.max(0, 3 - ctx.emergencyMonths);
    candidates.push({
      actionType: "INCREASE_EMERGENCY_RESERVE",
      title: "Build emergency liquidity toward 3 months",
      what: "Increase liquid reserves until expenses are covered for at least 3 months.",
      amount: undefined,
      why: `Current coverage is about ${ctx.emergencyMonths.toFixed(1)} months. Protect before optimise.`,
      goalLink: "Emergency reserve",
      risks: "Cash drag if held too long above target; inflation risk on Naira cash.",
      liquidityNote: "Funds should remain in high-liquidity instruments.",
      costsNote: "Money market / savings fees typically low; confirm provider schedule.",
      alternatives: ["Cut discretionary spend temporarily", "Pause non-urgent investing"],
      assumptions: { targetMonths: 3, gapMonths },
      scores: {
        financialImpact: 70,
        urgency: 90,
        riskReduction: 85,
        goalImpact: 60,
        liquidity: 95,
        preference: 50,
        suitability: 95,
        dataConfidence: ctx.dataConfidence * 100,
        vulnerabilityCare: 70,
      },
    });
  }

  if (ctx.highInterestDebtNgn > 0) {
    candidates.push({
      actionType: "REPAY_DEBT",
      title: "Prioritise high-interest debt repayment",
      what: "Allocate surplus cash flow to reduce high-interest personal or credit balances.",
      amount: ctx.highInterestDebtNgn,
      amountCurrency: "NGN",
      why: "Guaranteed interest saved often exceeds after-fee investment return for high-rate debt.",
      risks: "Reduced investable cash in the short term.",
      alternatives: ["Snowball smallest balances first", "Refinance if a cheaper facility exists"],
      assumptions: { debtBalance: ctx.highInterestDebtNgn },
      scores: {
        financialImpact: 80,
        urgency: 75,
        riskReduction: 80,
        goalImpact: 40,
        liquidity: 40,
        preference: 55,
        suitability: 90,
        dataConfidence: ctx.dataConfidence * 100,
        vulnerabilityCare: 65,
      },
    });
  }

  if (ctx.propertyPercent > 50) {
    candidates.push({
      actionType: "REDUCE_CONCENTRATION",
      title: "Address property concentration",
      what: "Avoid adding to property exposure; direct new savings into diversified liquid assets.",
      why: `Property represents about ${ctx.propertyPercent.toFixed(0)}% of estimated wealth.`,
      risks: "Opportunity cost if property appreciates; liquidity remains limited.",
      alternatives: ["Partial sale (long term)", "Increase non-property contributions only"],
      assumptions: { propertyPercent: ctx.propertyPercent },
      scores: {
        financialImpact: 55,
        urgency: 60,
        riskReduction: 75,
        goalImpact: 50,
        liquidity: 70,
        preference: 45,
        suitability: 85,
        dataConfidence: ctx.dataConfidence * 100,
        vulnerabilityCare: 50,
      },
    });
  }

  if (ctx.idleCashNgn >= 2_000_000 && ctx.emergencyMonths >= 3) {
    candidates.push({
      actionType: "DEPLOY_IDLE_CASH",
      title: "Review underutilised cash",
      what: "Consider deploying surplus cash above your emergency target into suitable instruments.",
      amount: Math.round(ctx.idleCashNgn * 0.5),
      amountCurrency: "NGN",
      why: "Cash above emergency needs may lose real value to inflation if left idle.",
      risks: "Market and liquidity risk once invested; suitability must be confirmed.",
      costsNote: "Fees depend on selected product — compare before consent.",
      alternatives: ["Ladder fixed deposits", "Money market fund", "Do nothing if large purchase imminent"],
      regulatoryStatus: "Product-specific; confirm provider licence before execution.",
      assumptions: { idleCashNgn: ctx.idleCashNgn },
      scores: {
        financialImpact: 65,
        urgency: 40,
        riskReduction: 30,
        goalImpact: 70,
        liquidity: 50,
        preference: 60,
        suitability: 70,
        dataConfidence: ctx.dataConfidence * 100,
        vulnerabilityCare: 40,
      },
    });
  }

  if (ctx.staleAssetCount > 0) {
    candidates.push({
      actionType: "UPDATE_STALE_VALUATION",
      title: "Update stale asset valuations",
      what: `Refresh ${ctx.staleAssetCount} outdated valuation(s) so net worth and advice stay reliable.`,
      why: "Stale property or private holdings reduce confidence in every downstream recommendation.",
      risks: "None material — data hygiene action.",
      alternatives: ["Upload recent valuation document", "Ask an adviser to estimate"],
      assumptions: { staleAssetCount: ctx.staleAssetCount },
      scores: {
        financialImpact: 30,
        urgency: 55,
        riskReduction: 40,
        goalImpact: 35,
        liquidity: 50,
        preference: 50,
        suitability: 100,
        dataConfidence: 90,
        vulnerabilityCare: 50,
      },
    });
  }

  if (!ctx.hasLifeInsurance) {
    candidates.push({
      actionType: "BUY_PROTECTION",
      title: "Review life protection cover",
      what: "Assess whether life cover is appropriate given dependants and liabilities.",
      why: "Protection gaps can undermine an otherwise strong wealth plan.",
      risks: "Premium cost; over-insurance if needs are modest.",
      alternatives: ["Seek regulated adviser review", "Do nothing if no dependants/liabilities"],
      regulatoryStatus: "Insurance is provided by licensed insurers, not by WealthOS.",
      assumptions: {},
      scores: {
        financialImpact: 40,
        urgency: 50,
        riskReduction: 70,
        goalImpact: 45,
        liquidity: 40,
        preference: 40,
        suitability: 80,
        dataConfidence: ctx.dataConfidence * 100,
        vulnerabilityCare: 60,
      },
    });
  }

  if (ctx.ngnExposurePercent > 85) {
    candidates.push({
      actionType: "INCREASE_FX_EXPOSURE",
      title: "Consider modest foreign-currency diversification",
      what: "Evaluate a small allocation to USD/GBP instruments consistent with goals and liquidity.",
      why: `About ${ctx.ngnExposurePercent.toFixed(0)}% of assets are Naira-denominated.`,
      risks: "FX volatility; convertibility and policy risk; product suitability required.",
      alternatives: ["USD money market", "Diaspora account", "Do nothing if FX needs are near-term NGN"],
      assumptions: { ngnExposurePercent: ctx.ngnExposurePercent },
      scores: {
        financialImpact: 50,
        urgency: 35,
        riskReduction: 55,
        goalImpact: 55,
        liquidity: 45,
        preference: 50,
        suitability: 65,
        dataConfidence: ctx.dataConfidence * 100,
        vulnerabilityCare: 45,
      },
    });
  }

  if (ctx.goalUnderfundedCount > 0) {
    candidates.push({
      actionType: "INCREASE_GOAL_CONTRIBUTION",
      title: "Increase funding for underfunded goals",
      what: "Raise monthly contributions to the goals furthest off track.",
      why: `${ctx.goalUnderfundedCount} goal(s) appear underfunded relative to target date.`,
      risks: "Cash-flow pressure if contributions are raised too aggressively.",
      alternatives: ["Extend target date", "Reduce goal amount", "Seek adviser planning session"],
      assumptions: { underfunded: ctx.goalUnderfundedCount },
      scores: {
        financialImpact: 60,
        urgency: 55,
        riskReduction: 35,
        goalImpact: 90,
        liquidity: 40,
        preference: 65,
        suitability: 85,
        dataConfidence: ctx.dataConfidence * 100,
        vulnerabilityCare: 50,
      },
    });
  }

  if (ctx.vulnerableFlag || ctx.dataConfidence < 0.5) {
    candidates.push({
      actionType: "SEEK_HUMAN_ADVICE",
      title: "Speak with a regulated financial adviser",
      what: "Escalate to a human adviser for a supervised review of your position.",
      why: "AI confidence is limited or vulnerability indicators require human care.",
      risks: "Advisory fees may apply depending on the firm.",
      alternatives: ["Complete missing data first", "Continue with self-service for non-material items"],
      regulatoryStatus: "Human advice is provided by regulated advisers, not by the AI alone.",
      assumptions: { dataConfidence: ctx.dataConfidence },
      scores: {
        financialImpact: 40,
        urgency: 70,
        riskReduction: 60,
        goalImpact: 50,
        liquidity: 50,
        preference: 40,
        suitability: 100,
        dataConfidence: 100,
        vulnerabilityCare: 100,
      },
    });
  }

  return candidates;
}

export function scoreActions(candidates: ActionCandidate[]): ScoredAction[] {
  return candidates
    .map((c) => {
      const score =
        c.scores.financialImpact * WEIGHTS.financialImpact +
        c.scores.urgency * WEIGHTS.urgency +
        c.scores.riskReduction * WEIGHTS.riskReduction +
        c.scores.goalImpact * WEIGHTS.goalImpact +
        c.scores.liquidity * WEIGHTS.liquidity +
        c.scores.preference * WEIGHTS.preference +
        c.scores.suitability * WEIGHTS.suitability +
        c.scores.dataConfidence * WEIGHTS.dataConfidence +
        c.scores.vulnerabilityCare * WEIGHTS.vulnerabilityCare;

      // Boost DO_NOTHING when no urgent high-impact alternatives
      return {
        ...c,
        score,
        confidence: Math.min(1, c.scores.dataConfidence / 100),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function topActions(ctx: NbfaContext, limit = 3): ScoredAction[] {
  const scored = scoreActions(generateCandidates(ctx));
  // Prefer non-do-nothing when higher-urgency items exist
  const urgent = scored.filter(
    (a) => a.actionType !== "DO_NOTHING" && a.scores.urgency >= 50,
  );
  if (urgent.length >= limit) return urgent.slice(0, limit);
  if (urgent.length > 0) {
    return [...urgent, ...scored.filter((a) => a.actionType === "DO_NOTHING")].slice(0, limit);
  }
  return scored.slice(0, limit);
}
