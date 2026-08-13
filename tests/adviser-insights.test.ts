import { describe, expect, it } from "vitest";
import { buildAdviserInsights } from "@/engines/adviser-insights";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("adviser insights pack", () => {
  it("prioritises escalations and data gaps", () => {
    const pack = buildAdviserInsights({
      customerName: "Yomi",
      netWorthNgn: 120_000_000,
      confidence: 0.55,
      healthScore: 62,
      emergencyMonths: 1.5,
      staleAssetCount: 2,
      dataQualityHighPriority: 2,
      behindGoalCount: 1,
      monthlyFundingGapNgn: 80_000,
      openEscalations: 1,
      proposedActions: 3,
      latestDigestHeadline: "Two areas deserve a calm look this week.",
      attention: ["Build emergency liquidity"],
    });

    expect(pack.talkingPoints[0].id).toBe("escalations");
    expect(pack.talkingPoints.some((p) => p.id === "data_quality")).toBe(true);
    expect(pack.talkingPoints.some((p) => p.id === "funding")).toBe(true);
    expect(pack.doNotSay.length).toBeGreaterThan(2);
    expect(pack.briefing).toContain("Yomi");
  });

  it("offers a steady pack when nothing critical", () => {
    const pack = buildAdviserInsights({
      customerName: "Chioma",
      netWorthNgn: 80_000_000,
      confidence: 0.9,
      healthScore: 80,
      emergencyMonths: 6,
      staleAssetCount: 0,
      dataQualityHighPriority: 0,
      behindGoalCount: 0,
      monthlyFundingGapNgn: 0,
      openEscalations: 0,
      proposedActions: 0,
      attention: [],
    });
    expect(pack.talkingPoints.some((p) => p.id === "steady")).toBe(true);
  });

  it("keeps adviser insights API on disk", () => {
    expect(
      existsSync(join(process.cwd(), "src/app/api/adviser/insights/[customerId]/route.ts")),
    ).toBe(true);
    expect(existsSync(join(process.cwd(), "src/engines/adviser-insights.ts"))).toBe(true);
  });
});
