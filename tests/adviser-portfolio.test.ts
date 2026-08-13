import { describe, expect, it } from "vitest";
import {
  buildPortfolioCareRadar,
  filterPortfolioCareRadar,
  parsePortfolioCareFilter,
} from "@/engines/adviser-portfolio";

const sample = [
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
];

describe("adviser portfolio care radar", () => {
  it("sorts complaints ahead of clear books", () => {
    const radar = buildPortfolioCareRadar(sample);

    expect(radar.customers[0]?.name).toBe("Yomi");
    expect(radar.customers[0]?.careTone).toBe("danger");
    expect(radar.withCareCount).toBe(2);
    expect(radar.totalComplaints).toBe(1);
    expect(radar.totalSupport).toBe(2);
    expect(radar.summary).toMatch(/complaint/i);
  });

  it("reports a clear portfolio", () => {
    const radar = buildPortfolioCareRadar([sample[0]!]);
    expect(radar.withCareCount).toBe(0);
    expect(radar.summary).toMatch(/clear/i);
    expect(radar.customers[0]?.careLabel).toBe("Clear");
  });

  it("filters the book by care slice", () => {
    const radar = buildPortfolioCareRadar(sample);
    expect(filterPortfolioCareRadar(radar, "care").customers.map((c) => c.name)).toEqual([
      "Yomi",
      "Chioma",
    ]);
    expect(filterPortfolioCareRadar(radar, "complaints").customers.map((c) => c.name)).toEqual([
      "Yomi",
    ]);
    expect(filterPortfolioCareRadar(radar, "privacy").customers.map((c) => c.name)).toEqual([
      "Yomi",
    ]);
    expect(filterPortfolioCareRadar(radar, "support").customers.map((c) => c.name)).toEqual([
      "Yomi",
      "Chioma",
    ]);
    expect(parsePortfolioCareFilter("bogus")).toBe("all");
    expect(parsePortfolioCareFilter("privacy")).toBe("privacy");
  });
});
