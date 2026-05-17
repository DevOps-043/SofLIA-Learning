import { expect } from "vitest";
import type { buildReportsAnalyticsAiPayload } from "../../reports-analytics.ai-payload.service";
import type {
  buildFallbackReportsAnalyticsBlueprint,
  parseReportsAnalyticsBlueprint,
} from "../../reports-analytics.blueprint.service";

type AiPayload = ReturnType<typeof buildReportsAnalyticsAiPayload>;
type FallbackBlueprint = ReturnType<typeof buildFallbackReportsAnalyticsBlueprint>;
type ParsedBlueprint = ReturnType<typeof parseReportsAnalyticsBlueprint>;

export function expectReportsAnalyticsBlueprint(
  fallbackBlueprint: FallbackBlueprint,
  parsedBlueprint: ParsedBlueprint,
  aiPayload: AiPayload,
) {
  expect(fallbackBlueprint.source).toBe("fallback");
  expect(fallbackBlueprint.sections.map((section) => section.id)).toEqual(
    expect.arrayContaining([
      "executive",
      "dashboard",
      "trends",
      "courses",
      "users",
      "segments",
      "quality",
      "rawData",
    ]),
  );
  expect(parsedBlueprint?.source).toBe("gemini");
  expect(parsedBlueprint?.sections[0].id).toBe("executive");
  expect(JSON.stringify(aiPayload)).not.toContain("ada@example.com");
  expect(JSON.stringify(aiPayload)).not.toContain("Ada");
}
