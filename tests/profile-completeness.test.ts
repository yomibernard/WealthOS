import { describe, expect, it } from "vitest";
import { buildCompletenessReport } from "@/engines/profile-completeness";
import { classifyIntent } from "@/ai/orchestrator";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("profile completeness", () => {
  it("scores a thin profile low", () => {
    const report = buildCompletenessReport({
      hasName: true,
      hasRiskTolerance: false,
      hasInvestmentExperience: false,
      hasLiquidityNeeds: false,
      hasRiskProfile: false,
      incomeCount: 0,
      expenseCount: 0,
      assetCount: 0,
      liabilityCount: 0,
      goalCount: 0,
      hasAiConsent: false,
      householdCount: 0,
      hasEmergencyGoalOrCash: false,
    });
    expect(report.score).toBeLessThan(40);
    expect(report.missing.length).toBeGreaterThan(5);
    expect(report.nextHref).toBeTruthy();
  });

  it("scores a rich profile high", () => {
    const report = buildCompletenessReport({
      hasName: true,
      hasRiskTolerance: true,
      hasInvestmentExperience: true,
      hasLiquidityNeeds: true,
      hasRiskProfile: true,
      incomeCount: 1,
      expenseCount: 2,
      assetCount: 3,
      liabilityCount: 1,
      goalCount: 2,
      hasAiConsent: true,
      householdCount: 1,
      hasEmergencyGoalOrCash: true,
    });
    expect(report.score).toBe(100);
    expect(report.missing).toHaveLength(0);
  });

  it("keeps profile routes on disk", () => {
    expect(existsSync(join(process.cwd(), "src/app/app/profile/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/api/profile/completeness/route.ts"))).toBe(
      true,
    );
  });
});

describe("profile completeness AI intent", () => {
  it("classifies profile questions", () => {
    expect(classifyIntent("Complete my profile")).toBe("profile_completeness");
    expect(classifyIntent("How is my financial profile completeness?")).toBe(
      "profile_completeness",
    );
  });
});
