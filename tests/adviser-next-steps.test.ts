import { describe, expect, it } from "vitest";
import {
  buildAdviserNextStepsPulse,
  formatAdviserNextStepsAiContent,
  wantsAdviserBookNextSteps,
} from "@/engines/adviser-next-steps";
import { runAdviserWealthAI } from "@/ai/orchestrator";

const customers = [
  {
    id: "yomi",
    name: "Yomi",
    openComplaints: 1,
    openPrivacy: 0,
    openSupport: 0,
    needsFirstAck: true,
    awaitingReceipt: false,
    sortScore: 11,
  },
  {
    id: "amaka",
    name: "Amaka",
    openComplaints: 0,
    openPrivacy: 1,
    openSupport: 1,
    needsFirstAck: false,
    awaitingReceipt: true,
    sortScore: 5.5,
  },
];

describe("adviser next-steps pulse", () => {
  it("ranks complaints first and deep-links Care desk", () => {
    const pulse = buildAdviserNextStepsPulse({
      totalComplaints: 1,
      totalPrivacy: 1,
      totalSupport: 1,
      unackedCareCount: 1,
      awaitingReceiptCount: 1,
      customers,
      notifyUnreadCount: 2,
      notifyHeadline: "2 unread adviser notifications",
      notifyHref: "/adviser/notifications?read=unread",
    });
    expect(pulse.items[0]?.kind).toBe("complaints");
    expect(pulse.items[0]?.href).toBe("/adviser/customers/yomi");
    expect(pulse.items[0]?.priority).toBe("critical");
    expect(pulse.count).toBeLessThanOrEqual(3);
  });

  it("surfaces unacked care when no complaints", () => {
    const pulse = buildAdviserNextStepsPulse({
      totalComplaints: 0,
      unackedCareCount: 1,
      customers: [
        {
          id: "yomi",
          name: "Yomi",
          openComplaints: 0,
          openPrivacy: 0,
          openSupport: 1,
          needsFirstAck: true,
          awaitingReceipt: false,
          sortScore: 3,
        },
      ],
    });
    expect(pulse.items.some((i) => i.kind === "unacked")).toBe(true);
    expect(pulse.primaryHref).toMatch(/\/adviser\/customers\/yomi/);
  });

  it("includes unread notifications when present", () => {
    const pulse = buildAdviserNextStepsPulse({
      notifyUnreadCount: 1,
      notifyHeadline: "Amaka marked your care update as seen",
      notifyHref: "/adviser/notifications?read=unread",
    });
    expect(pulse.items[0]?.kind).toBe("notifications");
    expect(pulse.primaryHref).toContain("/adviser/notifications");
  });

  it("returns quiet book do-nothing when clear", () => {
    const pulse = buildAdviserNextStepsPulse({
      totalComplaints: 0,
      totalPrivacy: 0,
      totalSupport: 0,
      unackedCareCount: 0,
      awaitingReceiptCount: 0,
      customers: [],
      notifyUnreadCount: 0,
    });
    expect(pulse.items).toHaveLength(1);
    expect(pulse.items[0]?.kind).toBe("do_nothing");
    expect(pulse.primaryHref).toBe("/adviser");
  });

  it("links awaiting receipt filter", () => {
    const pulse = buildAdviserNextStepsPulse({
      awaitingReceiptCount: 2,
      customers,
    });
    const awaiting = pulse.items.find((i) => i.kind === "awaiting");
    expect(awaiting?.href).toBe("/adviser?care=awaiting");
  });

  it("formats AI content with adviser Path links", () => {
    const pulse = buildAdviserNextStepsPulse({
      totalComplaints: 1,
      customers,
    });
    const text = formatAdviserNextStepsAiContent(pulse);
    expect(text).toMatch(/Path:\s*\/adviser/);
    expect(text).toMatch(/Care radar|book/i);
    expect(wantsAdviserBookNextSteps("What should I do next for my book?")).toBe(true);
    expect(wantsAdviserBookNextSteps("Hello")).toBe(false);

    const ai = runAdviserWealthAI("What should I do next for my book?", pulse);
    expect(ai.toolsUsed).toContain("adviserNextStepsPulse");
    expect(ai.content).toMatch(/Path:\s*\/adviser/);
    expect(ai.agent).toBe("CoachAI");
  });
});
