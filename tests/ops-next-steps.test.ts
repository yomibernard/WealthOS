import { describe, expect, it } from "vitest";
import {
  buildOpsNextStepsPulse,
  formatOpsNextStepsAiContent,
  wantsOpsNextSteps,
} from "@/engines/ops-next-steps";
import { runAdminWealthAI } from "@/ai/orchestrator";

describe("ops next-steps pulse", () => {
  it("ranks complaints before escalations and privacy", () => {
    const pulse = buildOpsNextStepsPulse({
      openComplaints: 1,
      openEscalations: 2,
      openPrivacy: 1,
      pendingChangeRequests: 1,
      unackedCareCustomers: 1,
      riskyFlagsOn: 1,
    });
    expect(pulse.items[0]?.kind).toBe("complaints");
    expect(pulse.items[0]?.href).toBe("/admin/escalations");
    expect(pulse.items[0]?.priority).toBe("critical");
    expect(pulse.count).toBeLessThanOrEqual(3);
    expect(pulse.primaryHref).toBe("/admin/escalations");
  });

  it("surfaces care handoff when formal queues are clear", () => {
    const pulse = buildOpsNextStepsPulse({
      unackedCareCustomers: 2,
      awaitingReceiptCount: 1,
    });
    expect(pulse.items[0]?.kind).toBe("care_handoff");
    expect(pulse.items[0]?.href).toBe("/adviser?care=unacked");
    expect(pulse.items.some((i) => i.kind === "awaiting")).toBe(true);
  });

  it("surfaces launch gate as critical", () => {
    const pulse = buildOpsNextStepsPulse({
      launchBlocked: true,
      launchBlockers: ["session_secret"],
      openPrivacy: 1,
    });
    expect(pulse.items.some((i) => i.kind === "launch_gate")).toBe(true);
    const gate = pulse.items.find((i) => i.kind === "launch_gate");
    expect(gate?.detail).toMatch(/session_secret/);
    expect(gate?.href).toBe("/admin/ops");
  });

  it("returns quiet do-nothing when clear", () => {
    const pulse = buildOpsNextStepsPulse({});
    expect(pulse.items).toHaveLength(1);
    expect(pulse.items[0]?.kind).toBe("do_nothing");
    expect(pulse.primaryHref).toBe("/admin/ops");
  });

  it("links maker-checker and flag risk", () => {
    const pulse = buildOpsNextStepsPulse({
      pendingChangeRequests: 2,
      riskyFlagsOn: 1,
    });
    expect(pulse.items[0]?.kind).toBe("change_requests");
    expect(pulse.items[0]?.href).toBe("/admin/change-requests");
    expect(pulse.items.some((i) => i.kind === "flag_risk" && i.href === "/admin/flags")).toBe(
      true,
    );
  });

  it("formats AI content with Path links", () => {
    const pulse = buildOpsNextStepsPulse({
      openComplaints: 1,
    });
    const text = formatOpsNextStepsAiContent(pulse);
    expect(text).toMatch(/Path:\s*\/admin/);
    expect(text).toMatch(/ops|daily board/i);
    expect(wantsOpsNextSteps("What should I do next for ops?")).toBe(true);
    expect(wantsOpsNextSteps("Hello")).toBe(false);

    const ai = runAdminWealthAI("What should I do next for ops?", pulse);
    expect(ai.toolsUsed).toContain("opsNextStepsPulse");
    expect(ai.content).toMatch(/Path:\s*\/admin/);
    expect(ai.agent).toBe("CoachAI");
  });
});
