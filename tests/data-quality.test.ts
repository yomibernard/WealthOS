import { describe, expect, it } from "vitest";
import { assessItem, buildDataQualityReport } from "@/engines/data-quality";
import { classifyIntent } from "@/ai/orchestrator";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("data quality engine", () => {
  it("flags stale and low-confidence assets", () => {
    const item = assessItem(
      {
        id: "a1",
        kind: "asset",
        name: "Lagos flat",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.4,
        lastValuationDate: "2025-01-01T00:00:00Z",
        currency: "NGN",
      },
      new Date("2026-08-13T00:00:00Z"),
    );
    expect(item.issues.some((i) => i.code === "stale_valuation")).toBe(true);
    expect(item.issues.some((i) => i.code === "low_confidence")).toBe(true);
    expect(item.priority).toBeGreaterThan(0);
  });

  it("summarises a remediation queue", () => {
    const report = buildDataQualityReport(
      [
        {
          id: "a1",
          kind: "asset",
          name: "Flat",
          source: "MANUAL",
          verificationStatus: "STALE",
          confidence: 0.5,
          lastValuationDate: "2025-01-01T00:00:00Z",
          currency: "NGN",
        },
        {
          id: "c1",
          kind: "asset",
          name: "Cash",
          source: "CONNECTED",
          verificationStatus: "VERIFIED",
          confidence: 0.95,
          lastValuationDate: "2026-08-12T00:00:00Z",
          currency: "NGN",
        },
      ],
      0.7,
      new Date("2026-08-13T00:00:00Z"),
    );
    expect(report.highPriorityCount).toBeGreaterThanOrEqual(1);
    expect(report.items.some((i) => i.id === "a1")).toBe(true);
    expect(report.items.some((i) => i.id === "c1")).toBe(false);
  });

  it("keeps refresh API and confidence page", () => {
    expect(existsSync(join(process.cwd(), "src/app/api/wealth/refresh/route.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/app/wealth/confidence/page.tsx"))).toBe(true);
  });
});

describe("data quality AI intent", () => {
  it("classifies remediation questions", () => {
    expect(classifyIntent("How do I fix data confidence?")).toBe("data_quality");
    expect(classifyIntent("I have stale valuations")).toBe("data_quality");
  });
});
