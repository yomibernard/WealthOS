/**
 * Suitability Engine v1.0 — deterministic rules outside the LLM.
 */

export const SUITABILITY_VERSION = "suitability-1.0";

export type SuitabilityCustomer = {
  riskTolerance: "conservative" | "balanced" | "growth" | "aggressive";
  capacityForLoss: "low" | "medium" | "high";
  investmentHorizonYears: number;
  liquidityNeeds: "high" | "medium" | "low";
  knowledgeLevel: "novice" | "intermediate" | "experienced";
  hasDependants: boolean;
  emergencyMonths: number;
  debtToAssetRatio: number;
  concentrationPercent: number;
  currencyExposureNgnPercent: number;
  vulnerableFlag: boolean;
};

export type SuitabilityProduct = {
  id: string;
  name: string;
  riskRating: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  liquidity: "HIGH" | "MEDIUM" | "LOW" | "ILLIQUID";
  complexity: "simple" | "moderate" | "complex";
  currency: string;
  minimumInvestment: number;
};

export type SuitabilityOutcome = {
  outcome: "suitable" | "suitable_with_warnings" | "unsuitable" | "escalate";
  rulesFired: { rule: string; result: "pass" | "fail" | "warn"; detail: string }[];
  exceptions: string[];
  version: string;
  inputs: SuitabilityCustomer & { productId: string; productName: string };
};

const RISK_RANK: Record<string, number> = {
  VERY_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  VERY_HIGH: 5,
  conservative: 2,
  balanced: 3,
  growth: 4,
  aggressive: 5,
};

export function assessSuitability(
  customer: SuitabilityCustomer,
  product: SuitabilityProduct,
): SuitabilityOutcome {
  const rules: SuitabilityOutcome["rulesFired"] = [];
  const exceptions: string[] = [];

  if (customer.vulnerableFlag) {
    rules.push({
      rule: "VULNERABLE_CUSTOMER",
      result: "fail",
      detail: "Customer flagged as potentially vulnerable — escalate to human adviser.",
    });
    return wrap("escalate", rules, exceptions, customer, product);
  }

  if (customer.emergencyMonths < 1 && product.riskRating !== "VERY_LOW") {
    rules.push({
      rule: "EMERGENCY_RESERVE",
      result: "fail",
      detail: "Emergency liquidity below 1 month — investing is not suitable until reserve improved.",
    });
  } else if (customer.emergencyMonths < 3 && RISK_RANK[product.riskRating] >= 3) {
    rules.push({
      rule: "EMERGENCY_RESERVE",
      result: "warn",
      detail: "Emergency reserve under 3 months — prefer liquid, lower-risk options.",
    });
  } else {
    rules.push({
      rule: "EMERGENCY_RESERVE",
      result: "pass",
      detail: "Liquidity buffer acceptable for this product class.",
    });
  }

  const customerRisk = RISK_RANK[customer.riskTolerance];
  const productRisk = RISK_RANK[product.riskRating];
  if (productRisk > customerRisk + 1) {
    rules.push({
      rule: "RISK_MISMATCH",
      result: "fail",
      detail: `Product risk (${product.riskRating}) exceeds customer tolerance (${customer.riskTolerance}).`,
    });
  } else if (productRisk > customerRisk) {
    rules.push({
      rule: "RISK_MISMATCH",
      result: "warn",
      detail: "Product risk is at the upper edge of stated tolerance.",
    });
  } else {
    rules.push({
      rule: "RISK_MISMATCH",
      result: "pass",
      detail: "Product risk aligns with stated tolerance.",
    });
  }

  if (customer.capacityForLoss === "low" && productRisk >= 4) {
    rules.push({
      rule: "CAPACITY_FOR_LOSS",
      result: "fail",
      detail: "Low capacity for loss vs high-risk product.",
    });
  } else {
    rules.push({
      rule: "CAPACITY_FOR_LOSS",
      result: "pass",
      detail: "Capacity for loss check passed.",
    });
  }

  if (product.liquidity === "ILLIQUID" && customer.liquidityNeeds === "high") {
    rules.push({
      rule: "LIQUIDITY_NEED",
      result: "fail",
      detail: "Customer has high liquidity needs; illiquid product unsuitable.",
    });
  } else if (product.liquidity === "LOW" && customer.liquidityNeeds === "high") {
    rules.push({
      rule: "LIQUIDITY_NEED",
      result: "warn",
      detail: "Low-liquidity product may conflict with high liquidity needs.",
    });
  } else {
    rules.push({
      rule: "LIQUIDITY_NEED",
      result: "pass",
      detail: "Liquidity profile acceptable.",
    });
  }

  if (product.complexity === "complex" && customer.knowledgeLevel === "novice") {
    rules.push({
      rule: "KNOWLEDGE_COMPLEXITY",
      result: "fail",
      detail: "Complex product for novice investor — escalate or educate first.",
    });
  } else {
    rules.push({
      rule: "KNOWLEDGE_COMPLEXITY",
      result: "pass",
      detail: "Knowledge/complexity alignment acceptable.",
    });
  }

  if (customer.debtToAssetRatio > 0.5 && productRisk >= 3) {
    rules.push({
      rule: "DEBT_BURDEN",
      result: "warn",
      detail: "Elevated debt — consider debt reduction before higher-risk investing.",
    });
  } else {
    rules.push({
      rule: "DEBT_BURDEN",
      result: "pass",
      detail: "Debt burden not blocking.",
    });
  }

  if (customer.investmentHorizonYears < 2 && product.liquidity !== "HIGH") {
    rules.push({
      rule: "HORIZON",
      result: "warn",
      detail: "Short horizon with non-high liquidity product.",
    });
  } else {
    rules.push({
      rule: "HORIZON",
      result: "pass",
      detail: "Horizon aligns with product liquidity.",
    });
  }

  if (customer.concentrationPercent > 55) {
    rules.push({
      rule: "CONCENTRATION",
      result: "warn",
      detail: "Existing concentration high — new allocation should diversify, not deepen.",
    });
  } else {
    rules.push({
      rule: "CONCENTRATION",
      result: "pass",
      detail: "Concentration check acceptable.",
    });
  }

  const fails = rules.filter((r) => r.result === "fail");
  const warns = rules.filter((r) => r.result === "warn");
  if (fails.some((f) => f.rule === "VULNERABLE_CUSTOMER" || f.rule === "KNOWLEDGE_COMPLEXITY")) {
    return wrap("escalate", rules, exceptions, customer, product);
  }
  if (fails.length) return wrap("unsuitable", rules, exceptions, customer, product);
  if (warns.length) return wrap("suitable_with_warnings", rules, exceptions, customer, product);
  return wrap("suitable", rules, exceptions, customer, product);
}

function wrap(
  outcome: SuitabilityOutcome["outcome"],
  rulesFired: SuitabilityOutcome["rulesFired"],
  exceptions: string[],
  customer: SuitabilityCustomer,
  product: SuitabilityProduct,
): SuitabilityOutcome {
  return {
    outcome,
    rulesFired,
    exceptions,
    version: SUITABILITY_VERSION,
    inputs: {
      ...customer,
      productId: product.id,
      productName: product.name,
    },
  };
}
