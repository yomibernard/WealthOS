import { describe, expect, it } from "vitest";
import { calculateWealthHealth, DEFAULT_HEALTH_WEIGHTS } from "@/engines/wealth-health";

describe("wealth health", () => {
  it("uses configurable weights and stays within 0-100", () => {
    const result = calculateWealthHealth(
      {
        liquidAssetsNgn: 9_000_000,
        monthlyExpensesNgn: 2_500_000,
        monthlySavingsNgn: 1_000_000,
        monthlyIncomeNgn: 4_000_000,
        totalDebtNgn: 5_000_000,
        totalAssetsNgn: 100_000_000,
        largestAssetClassPercent: 58,
        goalProgressAvg: 70,
        hasLifeInsurance: true,
        hasHealthInsurance: true,
        retirementAllocationNgn: 30_000_000,
        retirementTargetNgn: 200_000_000,
        hasBeneficiaryInfo: true,
        hasEstateDocs: false,
        dataCoverage: 0.8,
      },
      DEFAULT_HEALTH_WEIGHTS,
    );
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.dimensions).toHaveLength(8);
    expect(result.improvementLevers.length).toBeLessThanOrEqual(3);
  });

  it("penalises low liquidity", () => {
    const weak = calculateWealthHealth({
      liquidAssetsNgn: 100_000,
      monthlyExpensesNgn: 2_000_000,
      monthlySavingsNgn: 0,
      monthlyIncomeNgn: 2_000_000,
      totalDebtNgn: 0,
      totalAssetsNgn: 50_000_000,
      largestAssetClassPercent: 30,
      goalProgressAvg: 50,
      hasLifeInsurance: false,
      hasHealthInsurance: false,
      retirementAllocationNgn: 0,
      retirementTargetNgn: 100_000_000,
      hasBeneficiaryInfo: false,
      hasEstateDocs: false,
      dataCoverage: 0.5,
    });
    const liquidity = weak.dimensions.find((d) => d.key === "liquidity");
    expect(liquidity?.score).toBeLessThan(50);
  });
});
