import { describe, expect, it } from "vitest";
import { generateCandidates, scoreActions, topActions } from "@/engines/nbfa";

describe("next best financial action", () => {
  it("can recommend doing nothing", () => {
    const candidates = generateCandidates({
      emergencyMonths: 6,
      propertyPercent: 30,
      idleCashNgn: 0,
      highInterestDebtNgn: 0,
      staleAssetCount: 0,
      hasLifeInsurance: true,
      goalUnderfundedCount: 0,
      ngnExposurePercent: 60,
      vulnerableFlag: false,
      dataConfidence: 0.9,
    });
    expect(candidates.some((c) => c.actionType === "DO_NOTHING")).toBe(true);
  });

  it("prioritises liquidity and debt over idle investing", () => {
    const top = topActions(
      {
        emergencyMonths: 1,
        propertyPercent: 58,
        idleCashNgn: 5_000_000,
        highInterestDebtNgn: 4_000_000,
        staleAssetCount: 1,
        hasLifeInsurance: false,
        goalUnderfundedCount: 1,
        ngnExposurePercent: 90,
        vulnerableFlag: false,
        dataConfidence: 0.8,
      },
      3,
    );
    expect(top).toHaveLength(3);
    expect(top[0].actionType).not.toBe("DEPLOY_IDLE_CASH");
    expect(top.some((t) => t.actionType === "INCREASE_EMERGENCY_RESERVE")).toBe(true);
  });

  it("scores deterministically", () => {
    const scored = scoreActions(
      generateCandidates({
        emergencyMonths: 2,
        propertyPercent: 20,
        idleCashNgn: 0,
        highInterestDebtNgn: 0,
        staleAssetCount: 0,
        hasLifeInsurance: true,
        goalUnderfundedCount: 0,
        ngnExposurePercent: 50,
        vulnerableFlag: false,
        dataConfidence: 0.7,
      }),
    );
    expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
  });
});
