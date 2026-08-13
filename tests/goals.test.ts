import { describe, expect, it } from "vitest";
import { comparePropertyDecision, projectGoal, requiredContribution } from "@/engines/goals";

describe("goal / twin engines", () => {
  it("projects a goal with range outputs", () => {
    const forecast = projectGoal({
      targetAmount: 100_000_000,
      targetDate: new Date("2036-01-01"),
      existingAllocation: 10_000_000,
      monthlyContribution: 500_000,
      now: new Date("2026-08-01"),
    });
    expect(forecast.projectedHigh).toBeGreaterThan(forecast.projectedLow);
    expect(forecast.monthsRemaining).toBeGreaterThan(0);
    expect(forecast.engineVersion).toBe("goal-1.0");
  });

  it("computes required contribution boundary", () => {
    expect(requiredContribution(100, 100, 12, 0.01)).toBe(0);
    expect(requiredContribution(100, 0, 0, 0.01)).toBe(100);
  });

  it("compares property decision options", () => {
    const options = comparePropertyDecision({
      propertyPrice: 70_000_000,
      cashAvailable: 30_000_000,
      mortgageRateAnnual: 0.22,
      mortgageTermYears: 20,
      rentMonthly: 1_500_000,
      investReturnAnnual: 0.12,
    });
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.id)).toEqual(["A", "B", "C"]);
  });
});
