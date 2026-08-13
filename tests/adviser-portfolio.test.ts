import { describe, expect, it } from "vitest";
import {
  buildPortfolioCareRadar,
  filterPortfolioCareRadar,
  formatCareAckCue,
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
    lastCareAckAt: "2026-08-10T10:00:00.000Z",
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
    expect(radar.unackedCareCount).toBe(1);
    expect(radar.totalComplaints).toBe(1);
    expect(radar.totalSupport).toBe(2);
    expect(radar.summary).toMatch(/first acknowledgment/i);
  });

  it("reports a clear portfolio", () => {
    const radar = buildPortfolioCareRadar([sample[0]!]);
    expect(radar.withCareCount).toBe(0);
    expect(radar.summary).toMatch(/clear/i);
    expect(radar.customers[0]?.careLabel).toBe("Clear");
  });

  it("filters the book by care slice including unacked", () => {
    const radar = buildPortfolioCareRadar(sample);
    expect(filterPortfolioCareRadar(radar, "care").customers.map((c) => c.name)).toEqual([
      "Yomi",
      "Chioma",
    ]);
    expect(filterPortfolioCareRadar(radar, "unacked").customers.map((c) => c.name)).toEqual([
      "Chioma",
    ]);
    expect(filterPortfolioCareRadar(radar, "complaints").customers.map((c) => c.name)).toEqual([
      "Yomi",
    ]);
    expect(parsePortfolioCareFilter("unacked")).toBe("unacked");
    expect(parsePortfolioCareFilter("bogus")).toBe("all");
  });

  it("formats care ack cues", () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    expect(formatCareAckCue(null, now)).toBe("No care ack yet");
    expect(formatCareAckCue("2026-08-13T08:00:00.000Z", now)).toBe("Acked today");
    expect(formatCareAckCue("2026-08-12T08:00:00.000Z", now)).toBe("Acked yesterday");
    expect(formatCareAckCue("2026-08-10T08:00:00.000Z", now)).toBe("Acked 3d ago");
  });
});
