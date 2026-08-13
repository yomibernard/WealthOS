import { describe, expect, it } from "vitest";
import { buildCareAckDraft } from "@/engines/adviser-care-ack";
import { resolveNotificationLink } from "@/lib/notification-links";

describe("adviser care acknowledgment", () => {
  it("builds a shared note draft that does not claim case closure", () => {
    const draft = buildCareAckDraft({
      kind: "complaint",
      customerName: "Yomi",
      adviserName: "Ada",
      message: "I've seen this — thank you for raising it.",
      itemTitle: "Open complaint",
    });
    expect(draft.title).toMatch(/complaint/i);
    expect(draft.href).toBe("/app/support");
    expect(draft.noteBody).toMatch(/does not close/i);
    expect(draft.notificationBody).toContain("Ada:");
  });

  it("routes privacy acknowledgments to Privacy Centre", () => {
    const draft = buildCareAckDraft({
      kind: "privacy",
      customerName: "Yomi",
      adviserName: "Ada",
      message: "Your erasure request is with ops.",
    });
    expect(draft.href).toBe("/app/privacy");
    expect(
      resolveNotificationLink({ title: draft.title, body: draft.notificationBody })?.href,
    ).toBe("/app/privacy");
  });
});
