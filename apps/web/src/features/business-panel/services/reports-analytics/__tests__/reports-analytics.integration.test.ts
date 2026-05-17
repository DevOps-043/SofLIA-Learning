import { describe, expect, it } from "vitest";
import { buildReportsAnalyticsAiPayload } from "../reports-analytics.ai-payload.service";
import {
  buildFallbackReportsAnalyticsBlueprint,
  parseReportsAnalyticsBlueprint,
} from "../reports-analytics.blueprint.service";
import { buildReportsAnalyticsDataset } from "../reports-analytics.server.service";
import { expectReportsAnalyticsBlueprint } from "./assertions/blueprint.assertions";
import { expectReportsAnalyticsDataset } from "./assertions/dataset.assertions";
import { expectReportsAnalyticsExports } from "./assertions/export.assertions";
import { buildReportsAnalyticsQueryData } from "./fixtures/query-data.fixture";
import { reportsAnalyticsFilters } from "./fixtures/filters.fixture";
import { reportsAnalyticsBlueprintJson } from "./fixtures/blueprint.fixture";

describe("reports analytics integration", () => {
  it("builds aggregate analytics and keeps user detail separate for exports", async () => {
    const result = buildReportsAnalyticsDataset(
      buildReportsAnalyticsQueryData(),
      reportsAnalyticsFilters,
    );
    const fallbackBlueprint = buildFallbackReportsAnalyticsBlueprint(
      result,
      "es",
      "gemini-test",
      "xlsx",
    );
    const parsedBlueprint = parseReportsAnalyticsBlueprint(reportsAnalyticsBlueprintJson, {
      dataset: result,
      locale: "es",
      model: "gemini-test",
      format: "xlsx",
    });
    const aiPayload = buildReportsAnalyticsAiPayload(result);

    expectReportsAnalyticsDataset(result);
    expectReportsAnalyticsBlueprint(fallbackBlueprint, parsedBlueprint, aiPayload);
    await expectReportsAnalyticsExports(result, fallbackBlueprint);
    expect(result.userDetails[0]).toEqual(
      expect.objectContaining({
        email: "ada@example.com",
        coursesCompleted: 1,
        sofliaConversations: 1,
        teamName: "Ventas Norte",
      }),
    );
  });
});
