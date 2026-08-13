import { describe, expect, it } from "vitest";
import { buildOpsCareHandoff, buildOpsDailyBoard } from "@/engines/ops-daily";

describe("ops daily board", () => {
  it("reports clear queues with zero attention", () => {
    const board = buildOpsDailyBoard({
      openEscalations: 0,
      openComplaints: 0,
      openPrivacy: 0,
      pendingChangeRequests: 0,
      launchBlocked: false,
      launchBlockers: [],
      riskyFlagsOn: 0,
      unackedCareCustomers: 0,
    });
    expect(board.attentionScore).toBe(0);
    expect(board.summary).toMatch(/clear/i);
    expect(board.queues.every((q) => q.tone === "ok")).toBe(true);
  });

  it("prioritises complaints and launch blockers in the summary", () => {
    const board = buildOpsDailyBoard({
      openEscalations: 2,
      openComplaints: 1,
      openPrivacy: 0,
      pendingChangeRequests: 1,
      launchBlocked: true,
      launchBlockers: ["session_secret"],
    });
    expect(board.attentionScore).toBeGreaterThan(5);
    expect(board.summary).toMatch(/Priority/i);
    expect(board.queues.find((q) => q.id === "complaints")?.tone).toBe("danger");
    expect(board.queues.find((q) => q.id === "launch_gate")?.tone).toBe("danger");
  });

  it("treats routine backlog without complaint urgency", () => {
    const board = buildOpsDailyBoard({
      openEscalations: 1,
      openComplaints: 0,
      openPrivacy: 2,
      pendingChangeRequests: 0,
      launchBlocked: false,
      launchBlockers: [],
    });
    expect(board.summary).toMatch(/Routine/i);
    expect(board.queues.find((q) => q.id === "privacy")?.count).toBe(2);
  });

  it("surfaces care handoff unacked customers", () => {
    const board = buildOpsDailyBoard({
      openEscalations: 0,
      openComplaints: 0,
      openPrivacy: 0,
      pendingChangeRequests: 0,
      launchBlocked: false,
      launchBlockers: [],
      unackedCareCustomers: 2,
    });
    const handoff = board.queues.find((q) => q.id === "care_handoff");
    expect(handoff?.count).toBe(2);
    expect(handoff?.href).toBe("/adviser?care=unacked");
    expect(handoff?.tone).toBe("warn");
    expect(board.attentionScore).toBe(2);
    expect(board.summary).toMatch(/Care handoff/i);

    const strip = buildOpsCareHandoff({
      unackedCareCustomers: 2,
      recentAcks: [
        {
          id: "n1",
          customerName: "Yomi",
          adviserName: "Ada",
          title: "Adviser acknowledged your complaint",
          createdAt: "2026-08-13T10:00:00.000Z",
        },
      ],
    });
    expect(strip.summary).toMatch(/first care acknowledgment/i);
    expect(strip.recentAcks).toHaveLength(1);
  });
});
