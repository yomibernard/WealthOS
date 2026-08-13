import { describe, expect, it } from "vitest";
import { buildPortfolioCareRadar } from "@/engines/adviser-portfolio";

describe("adviser portfolio care radar", () => {
  it("sorts complaints ahead of clear books", () => {
    const radar = buildPortfolioCareRadar([
      {
        id: "a",
        name: "Amaka",
        email: "a@demo.wealthos.ng",
        profileCompleteness: 80,
        openEscalations: 0,
        openComplaints: 0,
        openPrivacy: 0,
      },
      {
        id: "y",
        name: "Yomi",
        email: "y@demo.wealthos.ng",
        profileCompleteness: 70,
        openEscalations: 2,
        openComplaints: 1,
        openPrivacy: 1,
      },
      {
        id: "c",
        name: "Chioma",
        email: "c@demo.wealthos.ng",
        profileCompleteness: 90,
        openEscalations: 1,
        openComplaints: 0,
        openPrivacy: 0,
      },
    ]);

    expect(radar.customers[0]?.name).toBe("Yomi");
    expect(radar.customers[0]?.careTone).toBe("danger");
    expect(radar.withCareCount).toBe(2);
    expect(radar.totalComplaints).toBe(1);
    expect(radar.summary).toMatch(/complaint/i);
  });

  it("reports a clear portfolio", () => {
    const radar = buildPortfolioCareRadar([
      {
        id: "a",
        name: "Amaka",
        email: "a@demo.wealthos.ng",
        profileCompleteness: 80,
        openEscalations: 0,
        openComplaints: 0,
        openPrivacy: 0,
      },
    ]);
    expect(radar.withCareCount).toBe(0);
    expect(radar.summary).toMatch(/clear/i);
    expect(radar.customers[0]?.careLabel).toBe("Clear");
  });
});
