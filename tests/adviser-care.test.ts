import { describe, expect, it } from "vitest";
import { buildAdviserCareDesk } from "@/engines/adviser-care";
import { buildAdviserInsights } from "@/engines/adviser-insights";

describe("adviser care desk", () => {
  it("lists complaints and privacy before routine support", () => {
    const desk = buildAdviserCareDesk({
      escalations: [
        {
          id: "s1",
          reason: "SUPPORT: login help",
          status: "open",
          summary: "{}",
          updatedAt: "2026-08-13T10:00:00.000Z",
        },
        {
          id: "c1",
          reason: "COMPLAINT: wrong fee",
          status: "in_progress",
          summary: JSON.stringify({ resolution: "Investigating." }),
          updatedAt: "2026-08-13T11:00:00.000Z",
        },
      ],
      privacyRequests: [
        {
          id: "p1",
          type: "erasure",
          status: "open",
          details: "Please delete",
          resolution: null,
          updatedAt: "2026-08-13T12:00:00.000Z",
        },
      ],
    });

    expect(desk.openCount).toBe(3);
    expect(desk.complaintCount).toBe(1);
    expect(desk.privacyCount).toBe(1);
    expect(desk.items[0]?.priority).toBe("critical");
    expect(desk.summary).toMatch(/Care first/i);
  });

  it("reports a clear desk", () => {
    const desk = buildAdviserCareDesk({ escalations: [], privacyRequests: [] });
    expect(desk.openCount).toBe(0);
    expect(desk.summary).toMatch(/No open/i);
  });

  it("adds privacy talking points to insights when requests are open", () => {
    const pack = buildAdviserInsights({
      customerName: "Yomi",
      netWorthNgn: 10_000_000,
      confidence: 0.9,
      healthScore: 80,
      emergencyMonths: 6,
      staleAssetCount: 0,
      dataQualityHighPriority: 0,
      behindGoalCount: 0,
      monthlyFundingGapNgn: 0,
      openEscalations: 0,
      openComplaints: 0,
      openPrivacyRequests: 1,
      proposedActions: 0,
      attention: [],
    });
    expect(pack.talkingPoints[0]?.id).toBe("privacy");
  });
});
