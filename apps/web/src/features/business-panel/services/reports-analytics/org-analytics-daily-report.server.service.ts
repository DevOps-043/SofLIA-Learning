import "server-only";

import { getOrCreateDailyAiReport } from "@/features/business-panel/services/daily-ai-report";
import type { DailyAiReportDocument } from "@/features/business-panel/services/daily-ai-report/daily-ai-report.types";
import { createClient } from "@/lib/supabase/server";

import type {
  ReportsAnalyticsFilters,
  ReportsAnalyticsLocale,
} from "../../types/reports-analytics.types";
import {
  buildReportsAnalyticsInsightsFilename,
  generateReportsAnalyticsInsights,
  generateReportsAnalyticsInsightsPdf,
} from "./reports-analytics.insights.service";
import { fetchReportsAnalyticsDataset } from "./reports-analytics.server.service";

const UNIFIED_REPORT_TEMPLATE_VERSION = "premium-unified-v2";

interface OrganizationAnalyticsDailyReportParams {
  organizationId: string;
  filters: ReportsAnalyticsFilters;
  locale: ReportsAnalyticsLocale;
  generatedByUserId?: string | null;
}

/**
 * Returns the single daily organization analytics document.
 *
 * Both PDF actions call this service, so the expensive dataset and model work
 * happens only once per natural day, locale and filter scope. The template
 * version avoids reusing a legacy PDF generated earlier on the release day.
 */
export async function getOrganizationAnalyticsDailyReport(
  params: OrganizationAnalyticsDailyReportParams,
): Promise<DailyAiReportDocument> {
  const { organizationId, filters, locale, generatedByUserId } = params;

  return getOrCreateDailyAiReport({
    reportType: "org_reports_analytics",
    organizationId,
    locale,
    scopeKey: buildOrganizationAnalyticsReportScopeKey(filters),
    generatedByUserId,
    generate: async () => {
      const supabase = await createClient();
      const dataset = await fetchReportsAnalyticsDataset(
        supabase,
        organizationId,
        filters,
      );
      const insights = await generateReportsAnalyticsInsights({
        dataset,
        locale,
        requestedByUserId: generatedByUserId ?? undefined,
      });
      const bytes = await generateReportsAnalyticsInsightsPdf({
        dataset,
        insights,
        locale,
      });

      return {
        bytes,
        fileName: buildReportsAnalyticsInsightsFilename(dataset),
        modelName: insights.model,
      };
    },
  });
}

export function buildOrganizationAnalyticsReportScopeKey(
  filters: ReportsAnalyticsFilters,
): string {
  const filterScope = Object.entries(filters)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${toScopeValue(value)}`)
    .join("&");

  return `template=${UNIFIED_REPORT_TEMPLATE_VERSION}&${filterScope}`;
}

function toScopeValue(value: unknown): string {
  const text = String(value);
  const isoDateTime = /^(\d{4}-\d{2}-\d{2})T/.exec(text);

  return isoDateTime ? isoDateTime[1] : text;
}
