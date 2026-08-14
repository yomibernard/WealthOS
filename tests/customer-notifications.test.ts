import { describe, expect, it } from "vitest";
import {
  buildCustomerNotificationPulse,
  classifyCustomerNotificationKind,
  filterCustomerNotifications,
} from "@/engines/customer-notifications";

describe("customer notification pulse", () => {
  it("reports no headline when everything is read", () => {
    const pulse = buildCustomerNotificationPulse([
      {
        id: "1",
        category: "important",
        title: "Old alert",
        body: "…",
        read: true,
        createdAt: "2026-08-12T10:00:00.000Z",
      },
    ]);
    expect(pulse.unreadCount).toBe(0);
    expect(pulse.headline).toBeNull();
    expect(pulse.primaryHref).toBe("/app/notifications");
  });

  it("headlines a single unread care update", () => {
    const pulse = buildCustomerNotificationPulse([
      {
        id: "1",
        category: "important",
        title: "Adviser acknowledged your support case",
        body: "Ada: I've seen your support note.",
        read: false,
        createdAt: "2026-08-13T10:00:00.000Z",
      },
    ]);
    expect(pulse.unreadCount).toBe(1);
    expect(pulse.headline).toMatch(/Adviser acknowledged/i);
    expect(pulse.primaryHref).toBe("/app/notifications?read=unread");
  });

  it("counts multiple unread notifications", () => {
    const pulse = buildCustomerNotificationPulse([
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
        category: "informational",
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

describe("customer notification triage", () => {
  const notes = [
    {
      id: "care",
      category: "important",
      title: "Adviser acknowledged your support case",
      body: "Ada: I've seen your support note.",
      read: false,
      createdAt: "2026-08-13T10:00:00.000Z",
    },
    {
      id: "digest",
      category: "informational",
      title: "Weekly wealth digest ready",
      body: "Your weekly wealth digest is ready to review.",
      read: false,
      createdAt: "2026-08-12T14:00:00.000Z",
    },
    {
      id: "privacy",
      category: "important",
      title: "Privacy request update",
      body: "Your privacy request is being reviewed.",
      read: true,
      createdAt: "2026-08-11T09:00:00.000Z",
    },
    {
      id: "other",
      category: "important",
      title: "Liquidity below target",
      body: "Emergency coverage is under 3 months.",
      read: false,
      createdAt: "2026-08-10T08:00:00.000Z",
    },
  ];

  it("classifies care, cadence, privacy, and other", () => {
    expect(classifyCustomerNotificationKind(notes[0]!)).toBe("care_update");
    expect(classifyCustomerNotificationKind(notes[1]!)).toBe("cadence");
    expect(classifyCustomerNotificationKind(notes[2]!)).toBe("privacy");
    expect(classifyCustomerNotificationKind(notes[3]!)).toBe("other");
  });

  it("filters unread only", () => {
    const unread = filterCustomerNotifications(notes, { read: "unread" });
    expect(unread.map((n) => n.id)).toEqual(["care", "digest", "other"]);
  });

  it("filters care updates", () => {
    const care = filterCustomerNotifications(notes, { kind: "care_update" });
    expect(care.map((n) => n.id)).toEqual(["care"]);
  });

  it("filters cadence including history", () => {
    const cadence = filterCustomerNotifications(notes, { kind: "cadence" });
    expect(cadence.map((n) => n.id)).toEqual(["digest"]);
  });

  it("combines unread + cadence", () => {
    const combo = filterCustomerNotifications(notes, {
      read: "unread",
      kind: "cadence",
    });
    expect(combo.map((n) => n.id)).toEqual(["digest"]);
  });
});
