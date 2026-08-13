import { describe, expect, it } from "vitest";
import { assessGoalFunding, buildFundingPulse } from "@/engines/goal-funding";
import { classifyIntent } from "@/ai/orchestrator";
import { existsSync } from "node:fs";
import { join } from "node:path";

const baseDate = new Date("2026-08-13T00:00:00Z");

describe("goal funding pulse", () => {
  it("flags underfunded goals as behind or critical", () => {
    const pulse = assessGoalFunding({
      id: "g1",
      name: "Emergency fund",
      type: "EMERGENCY",
      currency: "NGN",
      priority: 1,
      targetAmount: 5_000_000,
      targetDate: new Date("2027-08-13T00:00:00Z"),
      existingAllocation: 200_000,
      monthlyContribution: 10_000,
      now: baseDate,
    });
    expect(["behind", "critical"]).toContain(pulse.status);
    expect(pulse.monthlyGap).toBeGreaterThan(0);
  });

  it("summarises portfolio funding gaps", () => {
    const report = buildFundingPulse([
      {
        id: "g1",
        name: "School",
        type: "EDUCATION",
        currency: "NGN",
        priority: 1,
        targetAmount: 20_000_000,
        targetDate: new Date("2028-01-01T00:00:00Z"),
        existingAllocation: 500_000,
        monthlyContribution: 20_000,
        now: baseDate,
      },
      {
        id: "g2",
        name: "Cash buffer",
        type: "EMERGENCY",
        currency: "NGN",
        priority: 2,
        targetAmount: 1_000_000,
        targetDate: new Date("2026-12-01T00:00:00Z"),
        existingAllocation: 900_000,
        monthlyContribution: 100_000,
        now: baseDate,
      },
    ]);
    expect(report.goals).toHaveLength(2);
    expect(report.summary.length).toBeGreaterThan(10);
  });

  it("keeps funding route on disk", () => {
    expect(existsSync(join(process.cwd(), "src/app/app/plan/funding/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/api/goals/[id]/funding/route.ts"))).toBe(true);
  });
});

describe("goal funding AI intent", () => {
  it("classifies funding questions", () => {
    expect(classifyIntent("Show my funding pulse")).toBe("goal_funding");
    expect(classifyIntent("Which goals are underfunded?")).toBe("goal_funding");
  });
});
