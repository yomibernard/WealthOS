import { describe, expect, it } from "vitest";
import {
  appendCareReceipt,
  buildAdviserCareReceiptNotify,
  buildCareAckDraft,
  buildCareAckHistory,
  buildCareUpdateList,
  buildCareUpdatePulse,
  formatCareUpdateAiContent,
  parseCareReceipt,
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

  it("builds recent care acknowledgment history for 360 with seen cues", () => {
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
        status: "open",
      },
      {
        id: "n0",
        title: "Older ack",
        body: appendCareReceipt(
          "Earlier note\n\nThis does not close the ops queue.",
          "2026-08-12T12:00:00.000Z",
          "Thanks Ada",
        ),
        createdAt: "2026-08-12T10:00:00.000Z",
        adviserName: "Ada",
        status: "seen",
      },
    ]);
    expect(history.count).toBe(2);
    expect(history.unseenCount).toBe(1);
    expect(history.items[0]?.id).toBe("n1");
    expect(history.items[0]?.seen).toBe(false);
    expect(history.items[1]?.seen).toBe(true);
    expect(history.items[1]?.thanksPreview).toMatch(/Thanks Ada/i);
    expect(history.summary).toMatch(/unseen/i);
  });

  it("builds a Home care-update pulse for unseen acks only", () => {
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
          status: "open",
        },
        {
          id: "n0",
          title: "Adviser acknowledged your privacy request",
          body: "Ada: ops has your request.",
          createdAt: "2026-07-01T10:00:00.000Z",
          adviserName: "Ada",
        },
        {
          id: "n2",
          title: "Adviser acknowledged your support case",
          body: appendCareReceipt("Ada: noted.", "2026-08-13T08:00:00.000Z"),
          createdAt: "2026-08-13T07:00:00.000Z",
          adviserName: "Ada",
          status: "seen",
        },
      ],
      now,
    );
    expect(pulse.count).toBe(1);
    expect(pulse.headline).toMatch(/Ada sent a care update/i);
    expect(pulse.primaryHref).toBe("/app/support");
    expect(pulse.items[0]?.id).toBe("n1");
    expect(pulse.items[0]?.seen).toBe(false);

    const privacyPulse = buildCareUpdatePulse(
      [
        {
          id: "p1",
          title: "Adviser acknowledged your privacy request",
          body: "Ada: Your erasure request is with ops.",
          createdAt: "2026-08-13T09:00:00.000Z",
          adviserName: "Ada",
        },
      ],
      now,
    );
    expect(privacyPulse.primaryHref).toBe("/app/privacy");
    expect(privacyPulse.items[0]?.href).toBe("/app/privacy");
  });

  it("lists recent care updates including seen receipts", () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    const list = buildCareUpdateList(
      [
        {
          id: "n1",
          title: "Adviser acknowledged your complaint",
          body: appendCareReceipt("Ada: I've seen this.", "2026-08-13T11:00:00.000Z", "Got it"),
          createdAt: "2026-08-12T10:00:00.000Z",
          adviserName: "Ada",
          status: "seen",
        },
      ],
      now,
    );
    expect(list.count).toBe(1);
    expect(list.items[0]?.seen).toBe(true);
    expect(list.items[0]?.thanksPreview).toMatch(/Got it/i);
  });

  it("parses and appends customer care receipts", () => {
    const body = appendCareReceipt("Ada: hello.", "2026-08-13T10:00:00.000Z", "Thank you");
    expect(body).toMatch(/Customer receipt/);
    expect(parseCareReceipt(body).thanksPreview).toMatch(/Thank you/i);
    expect(appendCareReceipt(body, "2026-08-14T10:00:00.000Z")).toBe(body);
  });

  it("builds adviser notify copy for care receipts", () => {
    const notify = buildAdviserCareReceiptNotify({
      customerId: "cust1",
      customerName: "Yomi",
      thanks: "Thanks Ada",
    });
    expect(notify.title).toMatch(/marked your care update as seen/i);
    expect(notify.body).toMatch(/Thanks Ada/);
    expect(notify.body).toMatch(/does not close/i);
    expect(notify.href).toBe("/adviser/customers/cust1");
    expect(notify.body).toContain(`Path: ${notify.href}`);
  });

  it("formats WealthAI care-update copy from the live pulse", () => {
    const empty = formatCareUpdateAiContent(null);
    expect(empty).toMatch(/does not close|mark a care update as seen/i);
    expect(empty).toMatch(/do not see an unseen/i);

    const withPulse = formatCareUpdateAiContent(
      buildCareUpdatePulse(
        [
          {
            id: "n1",
            title: "Adviser acknowledged your complaint",
            body: "Ada: I've seen this.",
            createdAt: "2026-08-13T10:00:00.000Z",
            adviserName: "Ada",
          },
        ],
        new Date("2026-08-13T12:00:00.000Z"),
      ),
    );
    expect(withPulse).toMatch(/unseen care update/i);
    expect(withPulse).toContain("/app/support");
    expect(withPulse).toMatch(/mark as seen/i);
  });
});
