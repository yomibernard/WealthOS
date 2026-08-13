import { describe, expect, it } from "vitest";
import {
  assertNoPasswordHash,
  buildCadenceSummary,
  classifySnapshotType,
  omitCredentialFields,
} from "@/engines/privacy-export";

describe("privacy export contract", () => {
  it("never includes passwordHash in a sample package shape", () => {
    const pack = {
      exportedAt: new Date().toISOString(),
      customer: {
        email: "demo@example.com",
        name: "Demo",
      },
    };
    expect(JSON.stringify(pack).includes("passwordHash")).toBe(false);
    expect(assertNoPasswordHash(pack)).toBe(true);
  });

  it("strips credential-like fields from nested objects", () => {
    const cleaned = omitCredentialFields({
      email: "a@b.com",
      passwordHash: "SECRET",
      apiToken: "x",
      nested: { sessionSecret: "y", ok: true },
    });
    expect(cleaned).toEqual({
      email: "a@b.com",
      nested: { ok: true },
    });
    expect(assertNoPasswordHash(cleaned)).toBe(true);
  });

  it("classifies cadence snapshots from payload type", () => {
    expect(classifySnapshotType(JSON.stringify({ type: "monthly_report" }))).toBe(
      "monthly_report",
    );
    expect(classifySnapshotType(JSON.stringify({ type: "weekly_digest" }))).toBe("weekly_digest");
    expect(classifySnapshotType("{}")).toBe("snapshot");
  });

  it("summarises digests, shares and nudges for the export header", () => {
    const cadence = buildCadenceSummary(
      [
        {
          id: "s1",
          createdAt: "2026-08-01T00:00:00.000Z",
          netWorthNgn: 1,
          confidence: 0.8,
          healthScore: 70,
          payloadJson: JSON.stringify({ type: "monthly_report" }),
        },
        {
          id: "s2",
          createdAt: "2026-08-08T00:00:00.000Z",
          netWorthNgn: 1,
          confidence: 0.8,
          healthScore: 71,
          payloadJson: JSON.stringify({ type: "weekly_digest" }),
        },
      ],
      [
        {
          id: "n1",
          kind: "customer_share",
          title: "Share",
          body: "…",
          status: "open",
          sharedWithCustomer: true,
          createdAt: "2026-08-08T00:00:00.000Z",
        },
        {
          id: "n2",
          kind: "adviser_nudge",
          title: "Nudge",
          body: "…",
          status: "open",
          sharedWithCustomer: true,
          createdAt: "2026-08-09T00:00:00.000Z",
        },
        {
          id: "n3",
          kind: "note",
          title: "Plain",
          body: "…",
          status: "open",
          sharedWithCustomer: false,
          createdAt: "2026-08-09T00:00:00.000Z",
        },
      ],
    );
    expect(cadence).toEqual({
      monthlyReportCount: 1,
      weeklyDigestCount: 1,
      shareCount: 1,
      nudgeCount: 1,
      snapshotIds: ["s1", "s2"],
    });
  });
});
