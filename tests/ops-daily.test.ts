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
    expect(handoff?.href).toBe("/admin/escalations");
    expect(handoff?.tone).toBe("warn");
    expect(board.attentionScore).toBe(2);
    expect(board.summary).toMatch(/Care handoff/i);

    const strip = buildOpsCareHandoff({
      unackedCareCustomers: 2,
      awaitingReceiptCount: 1,
      recentAcks: [
        {
          id: "n1",
          customerName: "Yomi",
          adviserName: "Ada",
          title: "Adviser acknowledged your complaint",
          createdAt: "2026-08-13T10:00:00.000Z",
        },
      ],
      recentReceipts: [
        {
          id: "r1",
          customerName: "Amaka",
          adviserName: "Ada",
          title: "Adviser acknowledged your support case",
          seenAt: "2026-08-12T15:00:00.000Z",
          thanksPreview: "Thanks — noted.",
        },
      ],
      recentReminds: [
        {
          id: "rm1",
          customerName: "Yomi",
          adminName: "Admin",
          createdAt: "2026-08-14T10:00:00.000Z",
          notificationCreated: true,
        },
      ],
    });
    expect(strip.summary).toMatch(/first care acknowledgment/i);
    expect(strip.summary).toMatch(/recent ops remind/i);
    expect(strip.recentAcks).toHaveLength(1);
    expect(strip.awaitingReceiptCount).toBe(1);
    expect(strip.recentReceipts[0]?.thanksPreview).toMatch(/Thanks/i);
    expect(strip.recentReminds).toHaveLength(1);
    expect(strip.recentRemindCount).toBe(1);

    const answered = buildOpsCareHandoff({
      unackedCareCustomers: 0,
      awaitingReceiptCount: 0,
      recentAcks: [],
      recentRemindAnswers: [
        {
          id: "ra1",
          customerName: "Yomi",
          adviserName: "Ada",
          answeredAt: "2026-08-15T12:00:00.000Z",
        },
      ],
    });
    expect(answered.summary).toMatch(/remind answer/i);
    expect(answered.recentRemindAnswerCount).toBe(1);

    const awaitingOnly = buildOpsCareHandoff({
      unackedCareCustomers: 0,
      awaitingReceiptCount: 3,
      recentAcks: [],
      recentReceipts: [],
    });
    expect(awaitingOnly.summary).toMatch(/awaiting a customer receipt/i);
  });
});
