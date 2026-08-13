import { describe, expect, it } from "vitest";
import {
  buildPrivacyInboxDraft,
  buildPrivacyRequestsPulse,
} from "@/engines/privacy-requests";

describe("privacy requests pulse", () => {
  it("prioritises open erasure requests in the headline", () => {
    const pulse = buildPrivacyRequestsPulse([
      {
        id: "1",
        type: "erasure",
        status: "open",
        updatedAt: "2026-08-13T00:00:00.000Z",
      },
      {
        id: "2",
        type: "access",
        status: "in_progress",
        updatedAt: "2026-08-13T00:00:00.000Z",
      },
    ]);
    expect(pulse.openCount).toBe(2);
    expect(pulse.erasureOpen).toBe(true);
    expect(pulse.headline).toMatch(/Erasure/i);
    expect(pulse.primaryHref).toBe("/app/privacy");
  });

  it("surfaces recent closures when nothing is open", () => {
    const pulse = buildPrivacyRequestsPulse(
      [
        {
          id: "3",
          type: "access",
          status: "completed",
          updatedAt: "2026-08-12T00:00:00.000Z",
        },
      ],
      new Date("2026-08-13T12:00:00.000Z"),
    );
    expect(pulse.openCount).toBe(0);
    expect(pulse.recentlyClosedCount).toBe(1);
    expect(pulse.headline).toMatch(/recent privacy update/i);
  });

  it("builds inbox drafts deep-linked to Privacy Centre", () => {
    const open = buildPrivacyInboxDraft({
      id: "p1",
      type: "rectification",
      status: "open",
      details: "Fix my DOB",
    });
    expect(open.href).toBe("/app/privacy");
    expect(open.sourceId).toBe("p1");
    expect(open.sourceType).toBe("privacy_request");

    const done = buildPrivacyInboxDraft({
      id: "p1",
      type: "access",
      status: "completed",
      resolution: "Export attached.",
    });
    expect(done.sourceId).toBe("p1:completed");
    expect(done.body).toContain("Export attached.");
  });
});
