import { describe, expect, it } from "vitest";
import {
  buildDonutPaths,
  buildWealthMapSegments,
  convertNgnAmount,
  filterSnapshotsByPeriod,
  healthBand,
  healthShortLabel,
  scoreToArcPath,
} from "@/engines/wealth-visuals";

describe("wealth visuals", () => {
  it("filters snapshots by period without inventing points", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    const points = [
      { at: "2026-01-01T00:00:00Z", netWorthNgn: 100 },
      { at: "2026-07-01T00:00:00Z", netWorthNgn: 120 },
      { at: "2026-08-10T00:00:00Z", netWorthNgn: 130 },
    ];
    const month = filterSnapshotsByPeriod(points, "1M", now);
    expect(month).toHaveLength(1);
    expect(month[0].netWorthNgn).toBe(130);
  });

  it("converts NGN via FX table and refuses missing rates", () => {
    const rates = [{ from: "USD", to: "NGN", rate: 1600 }];
    expect(convertNgnAmount(160_000, "USD", rates)).toBe(100);
    expect(convertNgnAmount(100, "GBP", rates)).toBeNull();
  });

  it("builds wealth map buckets and keeps liabilities separate", () => {
    const segments = buildWealthMapSegments(
      [
        { category: "PROPERTY", valueNgn: 50, percent: 50 },
        { category: "CASH", valueNgn: 20, percent: 20 },
        { category: "CRYPTO", valueNgn: 10, percent: 10 },
        { category: "INSURANCE", valueNgn: 20, percent: 20 },
      ],
      15,
    );
    expect(segments.find((s) => s.id === "property")?.label).toBe("Property");
    expect(segments.find((s) => s.id === "other")?.valueNgn).toBe(30);
    expect(segments.find((s) => s.kind === "liability")?.valueNgn).toBe(15);
  });

  it("maps health bands without shaming language", () => {
    expect(healthBand(82).title).toMatch(/Strong/i);
    expect(healthBand(67).title).toMatch(/attention/i);
    expect(scoreToArcPath(50, 100, 100, 80)).toContain("A");
  });

  it("builds donut paths from grounded slice values", () => {
    const paths = buildDonutPaths(
      [
        { id: "cash", label: "Cash", value: 20, color: "#0f6e56" },
        { id: "property", label: "Property", value: 80, color: "#245b7a" },
      ],
      80,
      80,
      60,
      36,
    );
    expect(paths).toHaveLength(2);
    expect(paths[0].percent).toBe(20);
    expect(paths[1].d).toContain("A");
    expect(healthShortLabel(81)).toBe("Strong");
  });
});
