import { expect } from "vitest";
import type { buildReportsAnalyticsDataset } from "../../reports-analytics.server.service";

type ReportsAnalyticsDataset = ReturnType<typeof buildReportsAnalyticsDataset>;

export function expectReportsAnalyticsDataset(result: ReportsAnalyticsDataset) {
  expect(result.overview.totalUsers).toBe(2);
  expect(result.overview.completionRate).toBe(100);
  expect(result.learning.completedCourses).toBe(1);
  expect(result.learning.completionsTrend.every((point) => point.value === 0)).toBe(true);
  expect(result.demographics.missingGender).toBe(1);
  expect(result.dataQuality.usersMissingDemographics).toBe(1);
  expect(result.soflia.totalConversations).toBe(1);
  expect(result.soflia.totalMessages).toBe(4);
  expect(result.activities.totalActivities).toBe(2);
  expect(result.activities.completedActivities).toBe(2);
  expect(result.loginHeatmap.some((cell) => (
    cell.dayKey === "mon" && cell.hour === 15 && cell.value === 1
  ))).toBe(true);
  expect(result.connectionCalendar.some((cell) => (
    cell.date === "2026-04-27" && cell.value === 1
  ))).toBe(true);
  expect(result.rankings.regions[0]).toEqual(expect.objectContaining({ name: "Norte" }));
  expect(result.quality.overallScore).toBeGreaterThan(0);
}
