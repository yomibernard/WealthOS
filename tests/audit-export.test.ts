import { describe, expect, it } from "vitest";
import {
  buildAuditExportPackage,
  categoriseAuditEvent,
  filterAuditRows,
  parseAndRedactPayload,
  redactAuditPayload,
} from "@/engines/audit-export";

describe("audit export", () => {
  it("categorises known event types", () => {
    expect(categoriseAuditEvent("AUTH_SIGN_IN")).toBe("auth");
    expect(categoriseAuditEvent("PRIVACY_EXPORT_DOWNLOADED")).toBe("privacy");
    expect(categoriseAuditEvent("ESCALATION_UPDATED")).toBe("escalation");
    expect(categoriseAuditEvent("WEEKLY_WEALTH_DIGEST")).toBe("cadence");
    expect(categoriseAuditEvent("ADVISER_NUDGE_SENT")).toBe("adviser");
    expect(categoriseAuditEvent("AUDIT_EXPORT_DOWNLOADED")).toBe("admin");
    expect(categoriseAuditEvent("SOMETHING_NEW")).toBe("other");
  });

  it("redacts credential-like payload keys", () => {
    const redacted = redactAuditPayload({
      email: "a@b.com",
      passwordHash: "x",
      nested: { sessionSecret: "y", ok: 1 },
    });
    expect(redacted).toEqual({
      email: "a@b.com",
      passwordHash: "[redacted]",
      nested: { sessionSecret: "[redacted]", ok: 1 },
    });
    expect(JSON.stringify(parseAndRedactPayload('{"apiKey":"abc"}'))).toContain("[redacted]");
  });

  it("filters by category and search", () => {
    const rows = [
      {
        id: "1",
        eventType: "ESCALATION_CREATED",
        category: "escalation" as const,
        entityType: "Escalation",
        entityId: "e1",
        userId: "u1",
        createdAt: "2026-08-13T00:00:00.000Z",
        payload: { reason: "fee" },
      },
      {
        id: "2",
        eventType: "AUTH_SIGN_IN",
        category: "auth" as const,
        entityType: null,
        entityId: null,
        userId: "u2",
        createdAt: "2026-08-13T00:00:00.000Z",
        payload: {},
      },
    ];
    expect(filterAuditRows(rows, { category: "escalation" })).toHaveLength(1);
    expect(filterAuditRows(rows, { q: "fee" })[0]?.id).toBe("1");
  });

  it("builds an export package with counts", () => {
    const pack = buildAuditExportPackage({
      exportedAt: "2026-08-13T12:00:00.000Z",
      category: "all",
      rows: [
        {
          id: "1",
          eventType: "CONSENT_UPDATED",
          category: "consent",
          entityType: "Consent",
          entityId: "c1",
          userId: "u1",
          createdAt: "2026-08-13T00:00:00.000Z",
          payload: {},
        },
      ],
    });
    expect(pack.counts.total).toBe(1);
    expect(pack.counts.byCategory.consent).toBe(1);
    expect(pack.purpose).toMatch(/compliance/i);
  });
});
