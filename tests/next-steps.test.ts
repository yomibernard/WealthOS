import { describe, expect, it } from "vitest";
import {
  buildNextStepsPulse,
  formatNextStepsAiContent,
} from "@/engines/next-steps";
import { classifyIntent } from "@/ai/orchestrator";

describe("next-steps pulse", () => {
  it("ranks care before product actions", () => {
    const pulse = buildNextStepsPulse({
      careHeadline: "Care update from Ada",
      careHref: "/app/support",
      staleAssetCount: 2,
      dataConfidence: 0.6,
      actions: [{ title: "Build emergency liquidity", what: "Raise buffer." }],
    });
    expect(pulse.items[0]?.kind).toBe("care_update");
    expect(pulse.items[0]?.href).toBe("/app/support");
    expect(pulse.items.map((i) => i.kind)).toContain("data_quality");
    expect(pulse.count).toBeLessThanOrEqual(3);
  });

  it("prioritises complaints as critical support", () => {
    const pulse = buildNextStepsPulse({
      supportHeadline: "1 open complaint — view updates",
      supportHref: "/app/support",
      complaintCount: 1,
    });
    expect(pulse.items[0]?.kind).toBe("support");
    expect(pulse.items[0]?.priority).toBe("critical");
  });

  it("surfaces profile when incomplete", () => {
    const pulse = buildNextStepsPulse({
      profileScore: 55,
      profileSummary: "Close income and risk gaps.",
    });
    expect(pulse.items.some((i) => i.kind === "profile")).toBe(true);
    expect(pulse.primaryHref).toBe("/app/profile");
  });

  it("returns do-nothing when nothing needs attention", () => {
    const pulse = buildNextStepsPulse({
      dataConfidence: 0.9,
      staleAssetCount: 0,
      profileScore: 90,
      actions: [{ title: "No material action required right now" }],
    });
    expect(pulse.items).toHaveLength(1);
    expect(pulse.items[0]?.kind).toBe("do_nothing");
    expect(pulse.primaryHref).toBe("/app/actions");
  });

  it("formats AI content with paths", () => {
    const pulse = buildNextStepsPulse({
      careHeadline: "Unseen care update",
      careHref: "/app/support",
    });
    const text = formatNextStepsAiContent(pulse);
    expect(text).toMatch(/Unseen care update/i);
    expect(text).toMatch(/Path: \/app\/support/);
  });
});

describe("next-steps intent", () => {
  it("routes what should I do next to actions", () => {
    expect(classifyIntent("What should I do next?")).toBe("actions");
  });
});
