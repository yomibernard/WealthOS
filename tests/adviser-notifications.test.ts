import { describe, expect, it } from "vitest";
import {
  buildAdviserNotificationPulse,
  classifyAdviserNotificationKind,
  filterAdviserNotifications,
} from "@/engines/adviser-notifications";

describe("adviser notification pulse", () => {
  it("reports no headline when everything is read", () => {
    const pulse = buildAdviserNotificationPulse([
      {
        id: "1",
        category: "important",
        title: "Old receipt",
        body: "…",
        read: true,
        createdAt: "2026-08-12T10:00:00.000Z",
      },
    ]);
    expect(pulse.unreadCount).toBe(0);
    expect(pulse.headline).toBeNull();
    expect(pulse.primaryHref).toBe("/adviser/notifications");
  });

  it("headlines a single unread care receipt", () => {
    const pulse = buildAdviserNotificationPulse([
      {
        id: "1",
        category: "important",
        title: "Amaka marked your care update as seen",
        body: "Path: /adviser/customers/amaka",
        read: false,
        createdAt: "2026-08-13T10:00:00.000Z",
      },
      {
        id: "0",
        category: "important",
        title: "Older",
        body: "…",
        read: true,
        createdAt: "2026-08-12T10:00:00.000Z",
      },
    ]);
    expect(pulse.unreadCount).toBe(1);
    expect(pulse.headline).toMatch(/Amaka marked your care update/i);
    expect(pulse.primaryHref).toBe("/adviser/notifications?read=unread");
  });

  it("counts multiple unread notifications", () => {
    const pulse = buildAdviserNotificationPulse([
      {
        id: "1",
        category: "important",
        title: "A",
        body: "…",
        read: false,
        createdAt: "2026-08-13T11:00:00.000Z",
      },
      {
        id: "2",
        category: "important",
        title: "B",
        body: "…",
        read: false,
        createdAt: "2026-08-13T10:00:00.000Z",
      },
    ]);
    expect(pulse.unreadCount).toBe(2);
    expect(pulse.headline).toMatch(/2 unread/i);
  });
});

describe("adviser notification triage", () => {
  const notes = [
    {
      id: "care",
      category: "important",
      title: "Amaka marked your care update as seen",
      body: "Amaka sent a care receipt: Thanks. Path: /adviser/customers/amaka",
      read: false,
      createdAt: "2026-08-13T10:00:00.000Z",
    },
    {
      id: "share",
      category: "important",
      title: "Customer shared wealth briefing",
      body: "Yomi shared a briefing. Path: /adviser/customers/yomi",
      read: false,
      createdAt: "2026-08-12T14:00:00.000Z",
    },
    {
      id: "old",
      category: "important",
      title: "Customer shared profile status",
      body: "Chioma shared a briefing. Path: /adviser/customers/chioma",
      read: true,
      createdAt: "2026-08-11T09:00:00.000Z",
    },
    {
      id: "other",
      category: "informational",
      title: "Ops digest ready",
      body: "Daily strip updated.",
      read: false,
      createdAt: "2026-08-10T08:00:00.000Z",
    },
  ];

  it("classifies care receipts, shares, and other", () => {
    expect(classifyAdviserNotificationKind(notes[0]!)).toBe("care_receipt");
    expect(classifyAdviserNotificationKind(notes[1]!)).toBe("share");
    expect(
      classifyAdviserNotificationKind({
        title: "Ops reminder: Yomi still needs a care acknowledgment",
        body: "Ops asked you to acknowledge open care for Yomi. Path: /adviser/customers/yomi",
      }),
    ).toBe("care_handoff");
    expect(classifyAdviserNotificationKind(notes[3]!)).toBe("other");
  });

  it("filters unread only", () => {
    const unread = filterAdviserNotifications(notes, { read: "unread" });
    expect(unread.map((n) => n.id)).toEqual(["care", "share", "other"]);
  });

  it("filters care receipts", () => {
    const care = filterAdviserNotifications(notes, { kind: "care_receipt" });
    expect(care.map((n) => n.id)).toEqual(["care"]);
  });

  it("filters shares including read history", () => {
    const shares = filterAdviserNotifications(notes, { kind: "share" });
    expect(shares.map((n) => n.id)).toEqual(["share", "old"]);
  });

  it("combines unread + share", () => {
    const combo = filterAdviserNotifications(notes, {
      read: "unread",
      kind: "share",
    });
    expect(combo.map((n) => n.id)).toEqual(["share"]);
  });
});
