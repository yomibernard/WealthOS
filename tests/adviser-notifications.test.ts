import { describe, expect, it } from "vitest";
import { buildAdviserNotificationPulse } from "@/engines/adviser-notifications";

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
