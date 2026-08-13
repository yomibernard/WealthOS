import { describe, expect, it } from "vitest";
import { buildReportInsights, sparklinePath } from "@/engines/report-insights";
import { classifyIntent } from "@/ai/orchestrator";

describe("report insights", () => {
  it("explains need for history with a single snapshot", () => {
    const out = buildReportInsights([
      {
        id: "a",
        createdAt: "2026-08-01T00:00:00Z",
        netWorthNgn: 50_000_000,
        healthScore: 70,
        confidence: 0.8,
      },
    ]);
    expect(out.netWorthDeltaNgn).toBeNull();
    expect(out.insights[0].id).toBe("need_history");
  });

  it("flags net worth rise and health move", () => {
    const out = buildReportInsights([
      {
        id: "new",
        createdAt: "2026-08-01T00:00:00Z",
        netWorthNgn: 110_000_000,
        healthScore: 74,
        confidence: 0.85,
      },
      {
        id: "old",
        createdAt: "2026-07-01T00:00:00Z",
        netWorthNgn: 100_000_000,
        healthScore: 70,
        confidence: 0.7,
      },
    ]);
    expect(out.netWorthDeltaNgn).toBe(10_000_000);
    expect(out.insights.some((i) => i.id === "nw_up")).toBe(true);
    expect(out.insights.some((i) => i.id === "health_up")).toBe(true);
    expect(out.insights.some((i) => i.id === "confidence_up")).toBe(true);
  });

  it("builds a sparkline path", () => {
    const d = sparklinePath([1, 2, 3]);
    expect(d.startsWith("M")).toBe(true);
    expect(d.includes("L")).toBe(true);
  });
});

describe("monthly report AI intent", () => {
  it("classifies monthly report questions", () => {
    expect(classifyIntent("Show my monthly wealth report")).toBe("monthly_report");
    expect(classifyIntent("What is my month-over-month change?")).toBe("monthly_report");
  });
});
