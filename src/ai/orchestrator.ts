/**
 * WealthAI multi-agent orchestration.
 * LLM handles conversation/explanation only.
 * Calculations come from deterministic engines via tools.
 */

import { calculateNetWorth } from "@/engines/net-worth";
import { calculateWealthHealth, DEFAULT_HEALTH_WEIGHTS } from "@/engines/wealth-health";
import { topActions } from "@/engines/nbfa";
import { projectGoal, runDigitalTwinLite, comparePropertyDecision } from "@/engines/goals";
import { buildFundingPulse } from "@/engines/goal-funding";
import { assessSuitability } from "@/engines/suitability";
import { analyseOffer } from "@/engines/wealthguard";
import { analyseProperty } from "@/engines/property";
import { analyseBusiness } from "@/engines/business";
import { analyseInsurance } from "@/engines/insurance";
import { analysePension } from "@/engines/pension";
import { analyseTaxLite } from "@/engines/tax";
import { analyseCrypto } from "@/engines/crypto";
import { analyseLending } from "@/engines/lending";
import type { FxRateRow } from "@/engines/fx";

export type AgentName =
  | "ConciergeAI"
  | "PlannerAI"
  | "PortfolioAI"
  | "RiskAI"
  | "MarketAI"
  | "CoachAI"
  | "WealthGuardAI"
  | "ComplianceAI";

export type Intent =
  | "net_worth"
  | "health"
  | "liquidity"
  | "debt_vs_invest"
  | "retirement"
  | "education"
  | "property_decision"
  | "property_intel"
  | "business_intel"
  | "insurance"
  | "pension"
  | "tax"
  | "crypto"
  | "lending"
  | "allocation"
  | "product_compare"
  | "wealthguard"
  | "affordability"
  | "goals"
  | "actions"
  | "monthly_report"
  | "data_quality"
  | "goal_funding"
  | "weekly_digest"
  | "escalation"
  | "general";

export type CustomerContext = {
  userId: string;
  name: string;
  vulnerableFlag: boolean;
  baseCurrency: string;
  assets: {
    id: string;
    value: number;
    currency: string;
    ownershipPercent: number;
    confidence: number;
    lastValuationDate: Date;
    verificationStatus: string;
    category: string;
    liquidity: string;
    name: string;
    assetType?: string;
    incomeGenerated?: number;
    notes?: string | null;
    provider?: string | null;
  }[];
  liabilities: {
    id: string;
    balance: number;
    currency: string;
    ownershipPercent: number;
    confidence: number;
    lastValuationDate: Date;
    interestRate?: number | null;
    monthlyPayment?: number | null;
    type?: string;
    name: string;
  }[];
  incomes: { amount: number; currency: string; frequency: string; type: string; label?: string }[];
  hasDependants?: boolean;
  expenses: { amount: number; currency: string; frequency: string; category: string }[];
  goals: {
    id?: string;
    type: string;
    name: string;
    targetAmount: number;
    targetDate: Date;
    existingAllocation: number;
    monthlyContribution: number;
    currency: string;
    priority?: number;
  }[];
  riskProfile?: {
    riskTolerance: string;
    capacityForLoss: string;
    investmentHorizon: string;
    knowledgeLevel: string;
  } | null;
  memories: { category: string; content: string }[];
  consentsActive: string[];
  fxRates: FxRateRow[];
  products?: {
    id: string;
    name: string;
    riskRating: string;
    liquidity: string;
    currency: string;
    minimumInvestment: number;
    feesJson: string;
    providerName: string;
  }[];
};

export type AiResponse = {
  intent: Intent;
  agent: AgentName;
  content: string;
  confidence: number;
  toolsUsed: string[];
  assumptions: string[];
  missingInformation: string[];
  escalate: boolean;
  escalationReason?: string;
  recommendationIds?: string[];
};

export function classifyIntent(message: string): Intent {
  const m = message.toLowerCase();
  if (/escalat|human|adviser|advisor|speak to|talk to someone/.test(m)) return "escalation";
  if (/wealthguard|scam|this offer|whatsapp|guaranteed return|verify.*(invest|offer)/.test(m))
    return "wealthguard";
  if (/net worth|what am i worth|how wealthy|what do i own/.test(m)) return "net_worth";
  if (/health score|financially healthy|am i healthy/.test(m)) return "health";
  if (/emergency|liquidity|cash buffer/.test(m)) return "liquidity";
  if (/repay debt|debt or invest|should i invest or/.test(m)) return "debt_vs_invest";
  if (/pension|rsa\b|pencom|retirement pot|pension pot/.test(m)) return "pension";
  if (/\btax\b|paye|firs|withholding|pit\b/.test(m)) return "tax";
  if (/crypto|bitcoin|btc|ethereum|usdt|token\b/.test(m)) return "crypto";
  if (/lending|loan|debt service|borrow|credit card|mortgage payment/.test(m)) return "lending";
  if (/retire|retirement/.test(m)) return "retirement";
  if (/education|school fees|children.?s education/.test(m)) return "education";
  if (/buy.*(property|house|flat)|mortgage|renting/.test(m)) return "property_decision";
  if (/property (equity|yield|ltv|concentration|intelligence)|how much.*property/.test(m))
    return "property_intel";
  if (/business (equity|debt|intelligence|concentration)|private business|company worth/.test(m))
    return "business_intel";
  if (/insurance|life cover|sum assured|hmo|critical illness/.test(m)) return "insurance";
  if (/allocat|diversif|overexposed|portfolio|property represents/.test(m)) return "allocation";
  if (/compare|product a|why product|mutual fund|money market|treasury/.test(m))
    return "product_compare";
  if (/afford|what should i do with|₦|ngn\s*\d/.test(m)) return "affordability";
  if (
    /funding (pulse|gap|plan)|underfunded|increase (my )?contribution|monthly contribution|am i on track.*(goal|saving)/.test(
      m,
    )
  )
    return "goal_funding";
  if (/weekly (wealth )?digest|this week.?s (summary|digest)|week in review/.test(m))
    return "weekly_digest";
  if (/goal|saving enough/.test(m)) return "goals";
  if (/top three|what should i do|next best|priority/.test(m)) return "actions";
  if (/monthly (wealth )?report|wealth report|month.over.month|mom (change|report)/.test(m))
    return "monthly_report";
  if (
    /data (quality|confidence)|stale (asset|valuation)|refresh (my )?(valuation|wealth)|fix (my )?data/.test(
      m,
    )
  )
    return "data_quality";
  return "general";
}

export function routeAgent(intent: Intent): AgentName {
  switch (intent) {
    case "retirement":
    case "education":
    case "goals":
    case "property_decision":
      return "PlannerAI";
    case "allocation":
    case "product_compare":
    case "property_intel":
    case "business_intel":
      return "PortfolioAI";
    case "liquidity":
    case "debt_vs_invest":
    case "health":
    case "insurance":
    case "pension":
      return "RiskAI";
    case "affordability":
    case "tax":
    case "crypto":
    case "lending":
      return "MarketAI";
    case "wealthguard":
      return "WealthGuardAI";
    case "escalation":
      return "ComplianceAI";
    case "actions":
    case "monthly_report":
    case "data_quality":
    case "goal_funding":
    case "weekly_digest":
      return "CoachAI";
    case "net_worth":
    case "general":
    default:
      return "ConciergeAI";
  }
}

function monthlyTotal(
  rows: { amount: number; currency: string; frequency: string }[],
  fx: FxRateRow[],
): number {
  return rows.reduce((sum, r) => {
    const rate =
      r.currency === "NGN"
        ? 1
        : fx.find((f) => f.from === r.currency && f.to === "NGN")?.rate ?? 0;
    const monthly =
      r.frequency === "annual" || r.frequency === "yearly"
        ? r.amount / 12
        : r.frequency === "weekly"
          ? r.amount * 4.333
          : r.amount;
    return sum + monthly * rate;
  }, 0);
}

export function runWealthAI(message: string, ctx: CustomerContext): AiResponse {
  const intent = classifyIntent(message);
  const agent = routeAgent(intent);
  const toolsUsed: string[] = [];
  const assumptions: string[] = [];
  const missingInformation: string[] = [];

  // Compliance gate
  if (ctx.vulnerableFlag && /invest|buy|product|execute/.test(message.toLowerCase())) {
    return {
      intent,
      agent: "ComplianceAI",
      content:
        "I am escalating this to a human adviser because additional care is required before investment recommendations. Your existing information is safe. A specialist can review your situation with you.",
      confidence: 0.4,
      toolsUsed: ["ComplianceAI"],
      assumptions: [],
      missingInformation: [],
      escalate: true,
      escalationReason: "Vulnerable customer investment request",
    };
  }

  const nw = calculateNetWorth(ctx.assets, ctx.liabilities, ctx.fxRates);
  toolsUsed.push("netWorthEngine");

  const liquid = ctx.assets
    .filter((a) => a.liquidity === "HIGH" || a.category === "CASH")
    .reduce((s, a) => {
      const rate =
        a.currency === "NGN"
          ? 1
          : ctx.fxRates.find((f) => f.from === a.currency && f.to === "NGN")?.rate ?? 0;
      return s + a.value * (a.ownershipPercent / 100) * rate;
    }, 0);

  const monthlyExpenses = monthlyTotal(ctx.expenses, ctx.fxRates);
  const monthlyIncome = monthlyTotal(ctx.incomes, ctx.fxRates);
  const emergencyMonths = monthlyExpenses > 0 ? liquid / monthlyExpenses : 0;

  if (ctx.assets.length === 0) {
    missingInformation.push("No assets recorded yet");
  }
  if (nw.staleAssetIds.length) {
    missingInformation.push(`${nw.staleAssetIds.length} stale asset valuation(s)`);
  }

  let content = "";
  let confidence = nw.confidence;
  let escalate = false;
  let escalationReason: string | undefined;

  switch (intent) {
    case "net_worth": {
      content = [
        `${ctx.name}, your estimated net worth is ₦${Math.round(nw.netWorthNgn).toLocaleString("en-NG")}.`,
        `That is based on attributable assets of ₦${Math.round(nw.totalAssetsNgn).toLocaleString("en-NG")} minus liabilities of ₦${Math.round(nw.totalLiabilitiesNgn).toLocaleString("en-NG")}.`,
        `Confidence is about ${Math.round(nw.confidence * 100)}% given data provenance and freshness.`,
        nw.staleAssetIds.length
          ? `I have not received updated values for ${nw.staleAssetIds.length} holding(s). Because estimates can move net worth materially, treat this as directional rather than exact.`
          : "Valuations look reasonably current for this view.",
        "This figure is an estimate, not a bank statement.",
      ].join(" ");
      assumptions.push("Ownership percentages applied", "FX rates from approved table");
      break;
    }
    case "health":
    case "liquidity": {
      const propertyPercent =
        nw.assetBreakdown.find((b) => b.category === "PROPERTY")?.percent ?? 0;
      const health = calculateWealthHealth({
        liquidAssetsNgn: liquid,
        monthlyExpensesNgn: monthlyExpenses,
        monthlySavingsNgn: Math.max(0, monthlyIncome - monthlyExpenses),
        monthlyIncomeNgn: monthlyIncome,
        totalDebtNgn: nw.totalLiabilitiesNgn,
        totalAssetsNgn: nw.totalAssetsNgn,
        largestAssetClassPercent: nw.assetBreakdown[0]?.percent ?? 0,
        goalProgressAvg:
          ctx.goals.length === 0
            ? 40
            : ctx.goals.reduce((s, g) => s + (g.existingAllocation / g.targetAmount) * 100, 0) /
              ctx.goals.length,
        hasLifeInsurance: ctx.assets.some((a) => a.category === "INSURANCE"),
        hasHealthInsurance: ctx.memories.some((m) => /health insurance/i.test(m.content)),
        retirementAllocationNgn: ctx.assets
          .filter((a) => a.category === "PENSION")
          .reduce((s, a) => s + a.value * (a.ownershipPercent / 100), 0),
        retirementTargetNgn:
          ctx.goals.find((g) => g.type === "RETIREMENT")?.targetAmount ?? nw.netWorthNgn * 1.5,
        hasBeneficiaryInfo: ctx.memories.some((m) => /beneficiar/i.test(m.content)),
        hasEstateDocs: false,
        dataCoverage: Math.min(1, 0.4 + ctx.assets.length * 0.05),
      });
      toolsUsed.push("wealthHealthEngine");
      content =
        intent === "liquidity"
          ? `Your liquid assets cover roughly ${emergencyMonths.toFixed(1)} months of expenses. ${health.dimensions.find((d) => d.key === "liquidity")?.reason} Overall Wealth Health is ${health.overall}/100 (methodology ${health.version}).`
          : `Your Wealth Health Score is ${health.overall}/100 (version ${health.version}). Top attention areas: ${health.improvementLevers.join(" ")} Property concentration is about ${propertyPercent.toFixed(0)}% of assets.`;
      assumptions.push(...Object.entries(DEFAULT_HEALTH_WEIGHTS).map(([k, v]) => `${k}:${v}`));
      break;
    }
    case "debt_vs_invest": {
      const highDebt = ctx.liabilities
        .filter((l) => (l.interestRate ?? 0) >= 0.18)
        .reduce((s, l) => s + l.balance, 0);
      toolsUsed.push("nbfaEngine");
      content =
        highDebt > 0
          ? `With high-interest debt around ₦${Math.round(highDebt).toLocaleString("en-NG")}, repayment often comes before new investing — the interest saved is relatively certain. Once your emergency reserve reaches ~3 months and expensive debt is controlled, investing surplus may make sense. Suitability still depends on your goals and risk capacity.`
          : `I do not see high-interest debt dominating your balance sheet. If emergency liquidity is at least 3 months, carefully investing surplus can be reasonable — after suitability checks. I will not invent expected returns.`;
      confidence = Math.min(confidence, 0.75);
      break;
    }
    case "retirement": {
      const goal = ctx.goals.find((g) => g.type === "RETIREMENT");
      if (!goal) {
        missingInformation.push("No retirement goal defined");
        content =
          "I do not have a retirement goal on file yet. Share a target amount and age, or create a Retirement goal in Plan, and I can model a range.";
        confidence = 0.35;
      } else {
        const forecast = projectGoal(goal);
        toolsUsed.push("goalEngine");
        content = `For “${goal.name}”, the central projection is ₦${Math.round(forecast.projectedNominal).toLocaleString("en-NG")} (illustrative range ₦${Math.round(forecast.projectedLow).toLocaleString("en-NG")} – ₦${Math.round(forecast.projectedHigh).toLocaleString("en-NG")}). ${forecast.narrative} Assumptions: expected return ${(forecast.assumptions.expectedReturnAnnual * 100).toFixed(0)}% p.a., inflation ${(forecast.assumptions.inflationAnnual * 100).toFixed(0)}% p.a.`;
        assumptions.push(`return=${forecast.assumptions.expectedReturnAnnual}`, `inflation=${forecast.assumptions.inflationAnnual}`);
      }
      break;
    }
    case "education": {
      const goal = ctx.goals.find((g) => g.type === "EDUCATION");
      if (!goal) {
        content = "I do not have an education goal yet. Add one under Plan with a target date and amount.";
        confidence = 0.35;
        missingInformation.push("Education goal missing");
      } else {
        const twin = runDigitalTwinLite(nw.netWorthNgn, {
          type: "education_cost_rise",
          percent: 20,
          currentTarget: goal.targetAmount,
        });
        toolsUsed.push("digitalTwinLite");
        content = `${twin.headline} Revised need range about ₦${Math.round(twin.rangeLow).toLocaleString("en-NG")} – ₦${Math.round(twin.rangeHigh).toLocaleString("en-NG")}. ${twin.caveat}`;
      }
      break;
    }
    case "property_decision": {
      const priceMatch = message.match(/₦?\s?([\d,.]+)\s*m/i);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) * 1_000_000 : 70_000_000;
      const scenarios = comparePropertyDecision({
        propertyPrice: price,
        cashAvailable: liquid,
        mortgageRateAnnual: 0.22,
        mortgageTermYears: 20,
        rentMonthly: 1_500_000,
        investReturnAnnual: 0.12,
      });
      toolsUsed.push("decisionSimulator");
      content = [
        `Comparing options for a property around ₦${Math.round(price).toLocaleString("en-NG")}:`,
        ...scenarios.map(
          (s) =>
            `Option ${s.id} — ${s.label}: liquidity change ₦${Math.round(s.liquidityDelta).toLocaleString("en-NG")}, debt change ₦${Math.round(s.debtDelta).toLocaleString("en-NG")}. ${s.goalImpact} ${s.riskNote}`,
        ),
        "None of these outcomes are certain; assumptions dominate.",
      ].join("\n\n");
      confidence = 0.55;
      break;
    }
    case "property_intel": {
      const fx = (currency: string, amount: number) => {
        const rate =
          currency === "NGN"
            ? 1
            : ctx.fxRates.find((f) => f.from === currency && f.to === "NGN")?.rate ?? 0;
        return amount * rate;
      };
      const props = ctx.assets.filter((a) => a.category === "PROPERTY");
      const mortgages = ctx.liabilities.filter((l) => l.type === "MORTGAGE");
      const intel = analyseProperty(props, mortgages, nw.totalAssetsNgn, fx);
      toolsUsed.push("propertyEngine");
      content = [
        intel.narrative,
        `Owned property value ≈ ₦${Math.round(intel.propertyValueOwnedNgn).toLocaleString("en-NG")}; mortgages ≈ ₦${Math.round(intel.mortgageBalanceNgn).toLocaleString("en-NG")}; equity ≈ ₦${Math.round(intel.equityNgn).toLocaleString("en-NG")}.`,
        intel.signals.slice(0, 3).join(" "),
        intel.disclaimer,
      ]
        .filter(Boolean)
        .join(" ");
      confidence = Math.min(confidence, intel.weightedConfidence || 0.5);
      assumptions.push("Property values and ownership percentages from Wealth Graph");
      break;
    }
    case "business_intel": {
      const fx = (currency: string, amount: number) => {
        const rate =
          currency === "NGN"
            ? 1
            : ctx.fxRates.find((f) => f.from === currency && f.to === "NGN")?.rate ?? 0;
        return amount * rate;
      };
      const businesses = ctx.assets.filter((a) => a.category === "BUSINESS");
      const loans = ctx.liabilities.filter((l) => l.type === "BUSINESS_LOAN");
      const bizIncome = ctx.incomes
        .filter((i) => /business|divid|director|owner/i.test(`${i.type} ${i.label ?? ""}`))
        .reduce((s, i) => {
          const monthly =
            i.frequency === "annual" || i.frequency === "yearly"
              ? i.amount / 12
              : i.frequency === "weekly"
                ? i.amount * 4.333
                : i.amount;
          return s + fx(i.currency, monthly);
        }, 0);
      const intel = analyseBusiness(
        businesses,
        loans,
        nw.totalAssetsNgn,
        monthlyIncome,
        bizIncome,
        fx,
      );
      toolsUsed.push("businessEngine");
      content = [
        intel.narrative,
        `Business equity ≈ ₦${Math.round(intel.netBusinessEquityNgn).toLocaleString("en-NG")}.`,
        intel.signals.slice(0, 3).join(" "),
        intel.disclaimer,
      ]
        .filter(Boolean)
        .join(" ");
      confidence = Math.min(confidence, intel.weightedConfidence || 0.5);
      break;
    }
    case "insurance": {
      const fx = (currency: string, amount: number) => {
        const rate =
          currency === "NGN"
            ? 1
            : ctx.fxRates.find((f) => f.from === currency && f.to === "NGN")?.rate ?? 0;
        return amount * rate;
      };
      const policies = ctx.assets
        .filter((a) => a.category === "INSURANCE")
        .map((a) => ({
          id: a.id,
          name: a.name,
          assetType: a.assetType ?? "other",
          provider: a.provider,
          value: a.value,
          currency: a.currency,
          notes: a.notes,
          verificationStatus: a.verificationStatus,
          confidence: a.confidence,
        }));
      const intel = analyseInsurance(
        policies,
        monthlyIncome * 12,
        fx,
        Boolean(ctx.hasDependants),
      );
      toolsUsed.push("insuranceEngine");
      content = [
        intel.narrative,
        intel.gaps.slice(0, 3).join(" "),
        intel.signals.slice(0, 2).join(" "),
        intel.disclaimer,
      ]
        .filter(Boolean)
        .join(" ");
      confidence = 0.6;
      break;
    }
    case "pension": {
      const fx = (currency: string, amount: number) => {
        const rate =
          currency === "NGN"
            ? 1
            : ctx.fxRates.find((f) => f.from === currency && f.to === "NGN")?.rate ?? 0;
        return amount * rate;
      };
      const pots = ctx.assets.filter((a) => a.category === "PENSION");
      const retirementGoal =
        ctx.goals.find((g) => g.type === "RETIREMENT") ?? null;
      const intel = analysePension(
        pots.map((p) => ({
          id: p.id,
          name: p.name,
          assetType: p.assetType ?? "pension",
          provider: p.provider,
          value: p.value,
          currency: p.currency,
          ownershipPercent: p.ownershipPercent,
          lastValuationDate: p.lastValuationDate,
          verificationStatus: p.verificationStatus,
          confidence: p.confidence,
        })),
        nw.totalAssetsNgn,
        retirementGoal
          ? {
              targetAmount: retirementGoal.targetAmount,
              targetDate: retirementGoal.targetDate,
              existingAllocation: retirementGoal.existingAllocation,
              monthlyContribution: retirementGoal.monthlyContribution,
            }
          : null,
        fx,
      );
      toolsUsed.push("pensionEngine");
      content = [
        intel.narrative,
        intel.signals.slice(0, 3).join(" "),
        intel.disclaimer,
      ]
        .filter(Boolean)
        .join(" ");
      confidence = Math.min(confidence, intel.weightedConfidence || 0.55);
      break;
    }
    case "tax": {
      const fx = (currency: string, amount: number) => {
        const rate =
          currency === "NGN"
            ? 1
            : ctx.fxRates.find((f) => f.from === currency && f.to === "NGN")?.rate ?? 0;
        return amount * rate;
      };
      const tax = analyseTaxLite(
        ctx.incomes,
        fx,
        ctx.assets.some((a) => a.category === "INVESTMENT"),
        ctx.assets.some((a) => a.category === "PROPERTY" && (a.incomeGenerated ?? 0) > 0) ||
          ctx.incomes.some((i) => /rent/i.test(`${i.type} ${i.label ?? ""}`)),
      );
      toolsUsed.push("taxLiteEngine");
      content = [
        tax.narrative,
        tax.planningFlags.slice(0, 2).join(" "),
        tax.disclaimer,
      ]
        .filter(Boolean)
        .join(" ");
      confidence = 0.45;
      assumptions.push("Illustrative PIT bands — not official FIRS tables");
      break;
    }
    case "crypto": {
      const fx = (currency: string, amount: number) => {
        const rate =
          currency === "NGN"
            ? 1
            : ctx.fxRates.find((f) => f.from === currency && f.to === "NGN")?.rate ?? 0;
        return amount * rate;
      };
      const cryptoAssets = ctx.assets.filter(
        (a) =>
          a.category === "CRYPTO" ||
          /crypto|bitcoin|btc|eth|usdt|token/i.test(`${a.assetType ?? ""} ${a.name}`),
      );
      const intel = analyseCrypto(cryptoAssets, nw.totalAssetsNgn, fx);
      toolsUsed.push("cryptoLiteEngine");
      content = [
        intel.narrative,
        "Deferred: " + intel.deferredCapabilities.slice(0, 3).join("; ") + ".",
        intel.signals.slice(0, 2).join(" "),
        intel.disclaimer,
      ]
        .filter(Boolean)
        .join(" ");
      confidence = 0.5;
      break;
    }
    case "lending": {
      const fx = (currency: string, amount: number) => {
        const rate =
          currency === "NGN"
            ? 1
            : ctx.fxRates.find((f) => f.from === currency && f.to === "NGN")?.rate ?? 0;
        return amount * rate;
      };
      const intel = analyseLending(
        ctx.liabilities.map((l) => ({
          id: l.id,
          type: l.type ?? "OTHER",
          name: l.name,
          balance: l.balance,
          currency: l.currency,
          ownershipPercent: l.ownershipPercent,
          interestRate: l.interestRate,
          monthlyPayment: l.monthlyPayment,
        })),
        monthlyIncome,
        fx,
      );
      toolsUsed.push("lendingLiteEngine");
      content = [
        intel.narrative,
        intel.signals.slice(0, 3).join(" "),
        intel.disclaimer,
      ]
        .filter(Boolean)
        .join(" ");
      confidence = 0.55;
      break;
    }
    case "allocation": {
      const lines = nw.assetBreakdown
        .slice(0, 5)
        .map((b) => `${b.category}: ${b.percent.toFixed(0)}%`);
      const fx = nw.currencyExposure.map((c) => `${c.currency} ${c.percent.toFixed(0)}%`).join(", ");
      content = `Allocation by asset class — ${lines.join("; ")}. Currency exposure — ${fx || "n/a"}. Concentration above ~50% in one class (often Nigerian property) is a common risk for affluent households.`;
      toolsUsed.push("netWorthEngine");
      break;
    }
    case "actions": {
      const propertyPercent =
        nw.assetBreakdown.find((b) => b.category === "PROPERTY")?.percent ?? 0;
      const actions = topActions({
        emergencyMonths,
        propertyPercent,
        idleCashNgn: Math.max(0, liquid - monthlyExpenses * 3),
        highInterestDebtNgn: ctx.liabilities
          .filter((l) => (l.interestRate ?? 0) >= 0.18)
          .reduce((s, l) => s + l.balance, 0),
        staleAssetCount: nw.staleAssetIds.length,
        hasLifeInsurance: ctx.assets.some((a) => a.category === "INSURANCE"),
        goalUnderfundedCount: ctx.goals.filter((g) => g.existingAllocation / g.targetAmount < 0.5)
          .length,
        ngnExposurePercent:
          nw.currencyExposure.find((c) => c.currency === "NGN")?.percent ?? 100,
        vulnerableFlag: ctx.vulnerableFlag,
        dataConfidence: nw.confidence,
      });
      toolsUsed.push("nbfaEngine");
      content = [
        "Here are up to three priority actions (revenue is not the ranking driver):",
        ...actions.map(
          (a, i) =>
            `${i + 1}. ${a.title} — ${a.what} Why: ${a.why}`,
        ),
      ].join("\n");
      break;
    }
    case "product_compare": {
      const products = ctx.products ?? [];
      if (products.length < 2) {
        content =
          "I need at least two approved products in the catalogue to compare. Comparison uses suitability, risk, liquidity, fees and goal fit — not yield alone.";
        missingInformation.push("Product catalogue incomplete");
        confidence = 0.4;
      } else {
        const [a, b] = products;
        toolsUsed.push("suitabilityEngine");
        const horizonYears = parseInt(ctx.riskProfile?.investmentHorizon ?? "5", 10) || 5;
        const cust = {
          riskTolerance: (ctx.riskProfile?.riskTolerance as "balanced") || "balanced",
          capacityForLoss: (ctx.riskProfile?.capacityForLoss as "medium") || "medium",
          investmentHorizonYears: horizonYears,
          liquidityNeeds: "medium" as const,
          knowledgeLevel: (ctx.riskProfile?.knowledgeLevel as "intermediate") || "intermediate",
          hasDependants: true,
          emergencyMonths,
          debtToAssetRatio:
            nw.totalAssetsNgn > 0 ? nw.totalLiabilitiesNgn / nw.totalAssetsNgn : 0,
          concentrationPercent: nw.assetBreakdown[0]?.percent ?? 0,
          currencyExposureNgnPercent:
            nw.currencyExposure.find((c) => c.currency === "NGN")?.percent ?? 100,
          vulnerableFlag: ctx.vulnerableFlag,
        };
        const sa = assessSuitability(cust, {
          id: a.id,
          name: a.name,
          riskRating: a.riskRating as "MEDIUM",
          liquidity: a.liquidity as "MEDIUM",
          complexity: "simple",
          currency: a.currency,
          minimumInvestment: a.minimumInvestment,
        });
        const sb = assessSuitability(cust, {
          id: b.id,
          name: b.name,
          riskRating: b.riskRating as "MEDIUM",
          liquidity: b.liquidity as "MEDIUM",
          complexity: "simple",
          currency: b.currency,
          minimumInvestment: b.minimumInvestment,
        });
        content = `Comparing ${a.name} (${a.providerName}) vs ${b.name} (${b.providerName}). Suitability: ${a.name} → ${sa.outcome}; ${b.name} → ${sb.outcome}. Prefer the option that better matches liquidity needs and risk capacity, then review fees and exit terms. Headline return alone is never enough.`;
      }
      break;
    }
    case "wealthguard": {
      const analysis = analyseOffer(message);
      toolsUsed.push("wealthGuardEngine");
      content = [
        `WealthGuard outcome: ${analysis.overallOutcome}.`,
        `Provider verification: ${analysis.providerVerification}. Transparency: ${analysis.transparency}. Return claim: ${analysis.returnClaim}.`,
        analysis.explanation,
        analysis.warningIndicators.length
          ? `Indicators: ${analysis.warningIndicators.join(" ")}`
          : "",
        "WealthOS will not automatically call this safe, guaranteed, scam or fraud without authoritative evidence.",
      ]
        .filter(Boolean)
        .join(" ");
      confidence = 0.6;
      break;
    }
    case "escalation": {
      escalate = true;
      escalationReason = "Customer requested human help";
      content =
        "I can connect you with a support specialist or a regulated financial adviser. I will package your Wealth Graph summary, recent goals and open recommendations so you do not have to repeat everything.";
      confidence = 1;
      break;
    }
    case "monthly_report": {
      toolsUsed.push("wealthSnapshotHistory");
      content = [
        `Your latest estimated net worth is ₦${Math.round(nw.netWorthNgn).toLocaleString("en-NG")} (confidence ~${Math.round(nw.confidence * 100)}%).`,
        "Open Monthly wealth reports to generate a calm snapshot, see month-over-month movement, and print or save a PDF.",
        "Reports are informational only — not a product solicitation. Doing nothing can be a valid recommendation.",
        "Path: /app/reports",
      ].join(" ");
      confidence = Math.min(confidence, 0.85);
      break;
    }
    case "data_quality": {
      toolsUsed.push("dataQualityEngine");
      content = [
        `Overall net-worth confidence is about ${Math.round(nw.confidence * 100)}%.`,
        nw.staleAssetIds.length
          ? `${nw.staleAssetIds.length} holding(s) look stale — confirm today’s estimate or enter a new value.`
          : "No heavily stale valuations were flagged, but estimated private holdings should still be reviewed quarterly.",
        "Open Data confidence to work the remediation queue. WealthOS will not invent balances.",
        "Path: /app/wealth/confidence",
      ].join(" ");
      confidence = Math.min(confidence, 0.8);
      break;
    }
    case "goal_funding": {
      toolsUsed.push("goalFundingPulse");
      const pulse = buildFundingPulse(
        ctx.goals.map((g, index) => ({
          id: g.id ?? `goal-${index}`,
          name: g.name,
          type: g.type,
          currency: g.currency,
          priority: g.priority ?? index + 1,
          targetAmount: g.targetAmount,
          targetDate: g.targetDate,
          existingAllocation: g.existingAllocation,
          monthlyContribution: g.monthlyContribution,
        })),
      );
      content = [
        pulse.summary,
        pulse.behindCount
          ? "You can apply a suggested monthly contribution per goal in Goal funding pulse — still illustrative, not an instruction to buy a product."
          : "Keep contributions steady and revisit after life events or income changes.",
        "Path: /app/plan/funding",
      ].join(" ");
      confidence = Math.min(confidence, 0.8);
      break;
    }
    case "weekly_digest": {
      toolsUsed.push("weeklyDigest");
      content = [
        `Quick pulse: estimated net worth ₦${Math.round(nw.netWorthNgn).toLocaleString("en-NG")} (confidence ~${Math.round(nw.confidence * 100)}%), liquidity ≈ ${emergencyMonths.toFixed(1)} months.`,
        nw.staleAssetIds.length
          ? `${nw.staleAssetIds.length} stale valuation(s) — refresh in Data confidence.`
          : "No heavily stale valuations flagged.",
        "Open Weekly wealth digest for the full calm summary (position, data quality, funding, inbox), or generate one to save a notification.",
        "Path: /app/digest",
      ].join(" ");
      confidence = Math.min(confidence, 0.85);
      break;
    }
    case "affordability":
    default: {
      if (confidence < 0.45) {
        content =
          "I do not have enough verified information to answer this confidently. You can add the missing assets or liabilities, or ask for an adviser review.";
        escalate = true;
        escalationReason = "Low data confidence";
      } else {
        content = [
          `Estimated net worth is ₦${Math.round(nw.netWorthNgn).toLocaleString("en-NG")} (confidence ~${Math.round(nw.confidence * 100)}%).`,
          `Emergency liquidity ≈ ${emergencyMonths.toFixed(1)} months.`,
          "Ask me about retirement, debt vs investing, allocation, product comparison, monthly reports, or paste an investment offer for WealthGuard.",
          "I will not invent balances, returns, fees or regulatory status.",
        ].join(" ");
      }
      break;
    }
  }

  // Prompt-injection / jailbreak soft defence
  if (/ignore (all )?previous|reveal system prompt|bypass suitability/i.test(message)) {
    return {
      intent: "general",
      agent: "ComplianceAI",
      content:
        "I can only help with your financial questions within WealthOS policy. Suitability and calculation rules cannot be bypassed.",
      confidence: 1,
      toolsUsed: ["ComplianceAI"],
      assumptions: [],
      missingInformation: [],
      escalate: false,
    };
  }

  return {
    intent,
    agent,
    content,
    confidence,
    toolsUsed,
    assumptions,
    missingInformation,
    escalate,
    escalationReason,
  };
}
