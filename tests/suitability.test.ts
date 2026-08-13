import { describe, expect, it } from "vitest";
import { assessSuitability } from "@/engines/suitability";

const baseCustomer = {
  riskTolerance: "balanced" as const,
  capacityForLoss: "medium" as const,
  investmentHorizonYears: 5,
  liquidityNeeds: "medium" as const,
  knowledgeLevel: "intermediate" as const,
  hasDependants: true,
  emergencyMonths: 4,
  debtToAssetRatio: 0.1,
  concentrationPercent: 40,
  currencyExposureNgnPercent: 70,
  vulnerableFlag: false,
};

describe("suitability engine", () => {
  it("blocks investing when emergency reserve is critically low", () => {
    const result = assessSuitability(
      { ...baseCustomer, emergencyMonths: 0.2 },
      {
        id: "p1",
        name: "Bond Fund",
        riskRating: "MEDIUM",
        liquidity: "MEDIUM",
        complexity: "simple",
        currency: "NGN",
        minimumInvestment: 10000,
      },
    );
    expect(result.outcome).toBe("unsuitable");
    expect(result.rulesFired.some((r) => r.rule === "EMERGENCY_RESERVE" && r.result === "fail")).toBe(
      true,
    );
  });

  it("escalates vulnerable customers", () => {
    const result = assessSuitability(
      { ...baseCustomer, vulnerableFlag: true },
      {
        id: "p1",
        name: "MMF",
        riskRating: "LOW",
        liquidity: "HIGH",
        complexity: "simple",
        currency: "NGN",
        minimumInvestment: 1000,
      },
    );
    expect(result.outcome).toBe("escalate");
  });

  it("resists risk mismatch bypass", () => {
    const result = assessSuitability(
      { ...baseCustomer, riskTolerance: "conservative", capacityForLoss: "low" },
      {
        id: "p2",
        name: "Aggressive note",
        riskRating: "VERY_HIGH",
        liquidity: "ILLIQUID",
        complexity: "complex",
        currency: "USD",
        minimumInvestment: 5000,
      },
    );
    expect(["unsuitable", "escalate"]).toContain(result.outcome);
  });
});
