import { describe, expect, it } from "vitest";
import { buildOpsDailyBoard } from "@/engines/ops-daily";

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
});
