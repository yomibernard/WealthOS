import { describe, expect, it } from "vitest";
import { buildCaseInboxDraft, buildCustomerCasesPulse } from "@/engines/customer-cases";

describe("customer cases pulse", () => {
  it("headlines open complaints first", () => {
    const pulse = buildCustomerCasesPulse([
      {
        id: "1",
        reason: "COMPLAINT: wrong balance",
        status: "open",
        summary: JSON.stringify({ category: "complaint" }),
        createdAt: new Date("2026-08-10T00:00:00Z"),
        updatedAt: new Date("2026-08-10T00:00:00Z"),
      },
      {
        id: "2",
        reason: "SUPPORT: cannot export",
        status: "in_progress",
        summary: JSON.stringify({ category: "support" }),
        createdAt: new Date("2026-08-11T00:00:00Z"),
        updatedAt: new Date("2026-08-11T00:00:00Z"),
      },
    ]);
    expect(pulse.openCount).toBe(2);
    expect(pulse.complaintCount).toBe(1);
    expect(pulse.headline).toMatch(/complaint/i);
    expect(pulse.primaryHref).toBe("/app/support");
  });

  it("surfaces recent resolutions when nothing is open", () => {
    const pulse = buildCustomerCasesPulse(
      [
        {
          id: "3",
          reason: "SUPPORT: fixed",
          status: "resolved",
          summary: JSON.stringify({ resolution: "Cleared cache guidance." }),
          createdAt: new Date("2026-08-12T00:00:00Z"),
          updatedAt: new Date("2026-08-13T12:00:00Z"),
        },
      ],
      new Date("2026-08-13T18:00:00Z"),
    );
    expect(pulse.openCount).toBe(0);
    expect(pulse.recentlyResolvedCount).toBe(1);
    expect(pulse.headline).toMatch(/recent case update/i);
    expect(pulse.items[0]?.resolution).toBe("Cleared cache guidance.");
  });

  it("returns null headline with no relevant cases", () => {
    const pulse = buildCustomerCasesPulse([]);
    expect(pulse.headline).toBeNull();
    expect(pulse.openCount).toBe(0);
  });

  it("builds inbox drafts that deep-link to Support", () => {
    const open = buildCaseInboxDraft({
      id: "e1",
      reason: "COMPLAINT: fee",
      status: "open",
    });
    expect(open.href).toBe("/app/support");
    expect(open.title).toMatch(/complaint/i);
    expect(open.sourceId).toBe("e1");

    const resolved = buildCaseInboxDraft({
      id: "e1",
      reason: "SUPPORT: help",
      status: "resolved",
      resolution: "Fixed.",
    });
    expect(resolved.sourceId).toBe("e1:resolved");
    expect(resolved.body).toContain("Fixed.");
    expect(resolved.href).toBe("/app/support");
  });
});
