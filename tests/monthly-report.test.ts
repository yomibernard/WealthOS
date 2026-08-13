import { describe, expect, it } from "vitest";
import { historyFromSnapshots } from "@/services/wealth-report";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("monthly wealth report", () => {
  it("computes snapshot deltas newest-first", () => {
    const history = historyFromSnapshots([
      {
        id: "new",
        createdAt: new Date("2026-08-01T10:00:00Z"),
        netWorthNgn: 120_000_000,
        confidence: 0.8,
        healthScore: 72,
        payloadJson: JSON.stringify({ attention: ["Build buffer"] }),
      },
      {
        id: "old",
        createdAt: new Date("2026-07-01T10:00:00Z"),
        netWorthNgn: 100_000_000,
        confidence: 0.7,
        healthScore: 68,
        payloadJson: "{}",
      },
    ]);

    expect(history).toHaveLength(2);
    expect(history[0].deltaNgn).toBe(20_000_000);
    expect(history[0].attention).toEqual(["Build buffer"]);
    expect(history[1].deltaNgn).toBeNull();
  });

  it("keeps report routes on disk", () => {
    expect(existsSync(join(process.cwd(), "src/app/app/reports/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/app/reports/[id]/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/api/reports/monthly/route.ts"))).toBe(true);
  });
});
