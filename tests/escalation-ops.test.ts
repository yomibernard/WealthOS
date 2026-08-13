import { describe, expect, it } from "vitest";
import {
  buildCaseCareAckCue,
  classifyEscalationReason,
  customerCaseTitle,
  mergeEscalationResolution,
  parseEscalationSummary,
} from "@/engines/escalation-ops";

describe("escalation ops", () => {
  it("classifies complaint and support prefixes", () => {
    expect(classifyEscalationReason("COMPLAINT: fee confusion")).toBe("complaint");
    expect(classifyEscalationReason("SUPPORT: cannot export")).toBe("support");
    expect(classifyEscalationReason("Need an adviser")).toBe("other");
  });

  it("merges resolution into summary JSON without dropping context", () => {
    const summary = JSON.stringify({
      category: "complaint",
      reason: "Wrong balance shown",
      netWorth: 1_000_000,
    });
    const merged = mergeEscalationResolution(summary, "Confirmed display lag; fixed.", "resolved");
    const parsed = parseEscalationSummary(merged);
    expect(parsed.category).toBe("complaint");
    expect(parsed.netWorth).toBe(1_000_000);
    expect(parsed.resolution).toBe("Confirmed display lag; fixed.");
    expect(parsed.resolvedAt).toBeTruthy();
  });

  it("handles legacy plain-text summaries", () => {
    const merged = mergeEscalationResolution("plain note", "Closed after call.", "rejected");
    const parsed = parseEscalationSummary(merged);
    expect(parsed.resolution).toBe("Closed after call.");
  });

  it("titles customer notifications by category", () => {
    expect(customerCaseTitle("complaint", "resolved")).toBe("Complaint update");
    expect(customerCaseTitle("support", "in_progress")).toBe("Support case in progress");
  });

  it("flags open cases without a care acknowledgment", () => {
    expect(buildCaseCareAckCue({ status: "open" }).label).toBe("No care ack");
    expect(buildCaseCareAckCue({ status: "open" }).tone).toBe("warn");
    expect(
      buildCaseCareAckCue({
        status: "open",
        lastCareAckAt: "2026-08-13T10:00:00.000Z",
      }).label,
    ).toBe("Care acked");
    expect(buildCaseCareAckCue({ status: "resolved" }).tone).toBe("ok");
  });
});
