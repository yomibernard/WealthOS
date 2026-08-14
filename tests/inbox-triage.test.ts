import { describe, expect, it } from "vitest";
import {
  buildInboxPulse,
  classifyInboxKind,
  filterInboxItems,
} from "@/engines/inbox-triage";

describe("inbox pulse", () => {
  it("reports no headline when everything is read", () => {
    const pulse = buildInboxPulse([
      {
        id: "1",
        category: "recommendation",
        priority: "important",
        title: "Old action",
        body: "…",
        href: "/app/actions/1",
        status: "read",
        createdAt: "2026-08-12T10:00:00.000Z",
      },
    ]);
    expect(pulse.unreadCount).toBe(0);
    expect(pulse.headline).toBeNull();
    expect(pulse.primaryHref).toBe("/app/inbox");
  });

  it("headlines a single unread item and deep-links unread filter", () => {
    const pulse = buildInboxPulse([
      {
        id: "1",
        category: "adviser",
        priority: "important",
        title: "Care update · support case",
        body: "Ada acknowledged your case.",
        href: "/app/support",
        status: "unread",
        createdAt: "2026-08-13T10:00:00.000Z",
      },
    ]);
    expect(pulse.unreadCount).toBe(1);
    expect(pulse.headline).toMatch(/Care update/i);
    expect(pulse.primaryHref).toBe("/app/inbox?status=unread");
  });

  it("counts multiple unread items", () => {
    const pulse = buildInboxPulse([
      {
        id: "1",
        category: "recommendation",
        priority: "important",
        title: "A",
        body: "…",
        href: null,
        status: "unread",
        createdAt: "2026-08-13T11:00:00.000Z",
      },
      {
        id: "2",
        category: "connection",
        priority: "advisory",
        title: "B",
        body: "…",
        href: null,
        status: "unread",
        createdAt: "2026-08-13T10:00:00.000Z",
      },
    ]);
    expect(pulse.unreadCount).toBe(2);
    expect(pulse.headline).toMatch(/2 unread/i);
  });
});

describe("inbox triage", () => {
  const items = [
    {
      id: "rec",
      category: "recommendation",
      priority: "important",
      title: "Build emergency liquidity",
      body: "…",
      href: "/app/actions/1",
      status: "unread",
      createdAt: "2026-08-13T10:00:00.000Z",
    },
    {
      id: "conn",
      category: "connection",
      priority: "important",
      title: "GTBank needs attention",
      body: "…",
      href: "/app/connections",
      status: "unread",
      createdAt: "2026-08-12T14:00:00.000Z",
    },
    {
      id: "care",
      category: "adviser",
      priority: "important",
      title: "Care update · support case",
      body: "…",
      href: "/app/support",
      status: "read",
      createdAt: "2026-08-11T09:00:00.000Z",
    },
    {
      id: "complaint",
      category: "complaint",
      priority: "critical",
      title: "Open complaint",
      body: "…",
      href: "/app/support",
      status: "unread",
      createdAt: "2026-08-10T08:00:00.000Z",
    },
  ];

  it("classifies categories into triage kinds", () => {
    expect(classifyInboxKind("recommendation")).toBe("recommendation");
    expect(classifyInboxKind("complaint")).toBe("support");
    expect(classifyInboxKind("adviser")).toBe("adviser");
  });

  it("filters unread only", () => {
    const unread = filterInboxItems(items, { status: "unread" });
    expect(unread.map((i) => i.id)).toEqual(["rec", "conn", "complaint"]);
  });

  it("filters recommendations", () => {
    const recs = filterInboxItems(items, { kind: "recommendation" });
    expect(recs.map((i) => i.id)).toEqual(["rec"]);
  });

  it("filters support including complaints", () => {
    const support = filterInboxItems(items, { kind: "support" });
    expect(support.map((i) => i.id)).toEqual(["complaint"]);
  });

  it("combines unread + adviser", () => {
    const combo = filterInboxItems(items, { status: "unread", kind: "adviser" });
    expect(combo).toEqual([]);
  });
});
