import { describe, expect, it } from "vitest";
import {
  buildConnectionCalendar,
  buildLoginHeatmap,
  calculateAge,
  calculateRankScore,
  getAgeBand,
  getProgressBand,
  resolveLastConnectionAt,
} from "../reports-analytics.helpers";

describe("reports analytics helpers", () => {
  it("calculates age bands without storing derived age", () => {
    const today = new Date("2026-04-25T12:00:00.000Z");

    expect(calculateAge("1990-05-10", today)).toBe(35);
    expect(getAgeBand(17)).toBe("under_18");
    expect(getAgeBand(24)).toBe("18_24");
    expect(getAgeBand(35)).toBe("35_44");
    expect(getAgeBand(null)).toBe("unspecified");
  });

  it("groups learning progress into stable bands", () => {
    expect(getProgressBand(0)).toBe("not_started");
    expect(getProgressBand(25)).toBe("low");
    expect(getProgressBand(50)).toBe("medium");
    expect(getProgressBand(75)).toBe("high");
    expect(getProgressBand(99)).toBe("almost_done");
    expect(getProgressBand(100)).toBe("completed");
  });

  it("uses last login before updated_at for connection heatmap inputs", () => {
    expect(resolveLastConnectionAt("2026-04-25T10:00:00.000Z", "2026-04-26T10:00:00.000Z")).toBe("2026-04-25T10:00:00.000Z");
    expect(resolveLastConnectionAt(null, "2026-04-26T10:00:00.000Z")).toBe("2026-04-26T10:00:00.000Z");

    const dates = [
      "2026-04-27T15:10:00.000Z",
      "2026-04-27T15:20:00.000Z",
      "2026-04-28T03:00:00.000Z",
    ];
    const heatmap = buildLoginHeatmap(dates);
    const calendar = buildConnectionCalendar(dates, {
      from: "2026-04-27T00:00:00.000Z",
      to: "2026-04-30T23:59:59.999Z",
    });

    expect(heatmap.find((cell) => cell.dayKey === "mon" && cell.hour === 15)).toEqual(
      expect.objectContaining({ value: 2, percentage: 100 }),
    );
    expect(calendar.find((cell) => cell.date === "2026-04-27")).toEqual(
      expect.objectContaining({ value: 2, level: 4 }),
    );
    expect(calendar.find((cell) => cell.date === "2026-04-28")).toEqual(
      expect.objectContaining({ value: 1, level: 2 }),
    );
  });

  it("penalizes hierarchy ranking scores for overdue work", () => {
    const baseScore = {
      averageProgress: 90,
      completionRate: 85,
      sofliaAdoptionRate: 80,
      notesAdoptionRate: 75,
      qualityScore: 88,
      users: 10,
    };

    expect(calculateRankScore({ ...baseScore, overdueAssignments: 0 })).toBeGreaterThan(
      calculateRankScore({ ...baseScore, overdueAssignments: 20 }),
    );
  });
});
