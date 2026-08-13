import { describe, expect, it } from "vitest";
import {
  buildCareAckDraft,
  buildCareAckHistory,
  buildCareUpdatePulse,
} from "@/engines/adviser-care-ack";
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

  it("builds recent care acknowledgment history for 360", () => {
    const draft = buildCareAckDraft({
      kind: "support",
      customerName: "Yomi",
      adviserName: "Ada",
      message: "Following up personally while ops works the queue.",
      itemTitle: "Open support case",
    });
    const history = buildCareAckHistory([
      {
        id: "n1",
        title: draft.title,
        body: draft.noteBody,
        createdAt: "2026-08-13T10:00:00.000Z",
        adviserName: "Ada",
      },
      {
        id: "n0",
        title: "Older ack",
        body: "Earlier note\n\nThis does not close the ops queue.",
        createdAt: "2026-08-12T10:00:00.000Z",
        adviserName: "Ada",
      },
    ]);
    expect(history.count).toBe(2);
    expect(history.items[0]?.id).toBe("n1");
    expect(history.items[0]?.preview).toMatch(/Following up personally/i);
    expect(history.summary).toMatch(/2 care acknowledgment/i);
  });

  it("builds a Home care-update pulse for recent acks", () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    const empty = buildCareUpdatePulse([], now);
    expect(empty.headline).toBeNull();
    expect(empty.items).toEqual([]);

    const pulse = buildCareUpdatePulse(
      [
        {
          id: "n1",
          title: "Adviser acknowledged your complaint",
          body: "Ada: I've seen this.",
          createdAt: "2026-08-12T10:00:00.000Z",
          adviserName: "Ada",
        },
        {
          id: "n0",
          title: "Adviser acknowledged your privacy request",
          body: "Ada: ops has your request.",
          createdAt: "2026-07-01T10:00:00.000Z",
          adviserName: "Ada",
        },
      ],
      now,
    );
    expect(pulse.count).toBe(1);
    expect(pulse.headline).toMatch(/Ada sent a care update/i);
    expect(pulse.primaryHref).toBe("/app/support");
    expect(pulse.items[0]?.preview).toMatch(/I've seen this/i);
  });
});
