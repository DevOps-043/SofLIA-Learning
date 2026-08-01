import "server-only";

import {
  getLatestDailyAiReport,
  getLatestDailyAiReportRecord,
  getOrCreateDailyAiReport,
} from "@/features/business-panel/services/daily-ai-report";
import type {
  DailyAiReportDocument,
  DailyAiReportRecord,
} from "@/features/business-panel/services/daily-ai-report/daily-ai-report.types";
import { createClient } from "@/lib/supabase/server";

import type {
  ReportsAnalyticsFilters,
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsResponse,
} from "../../types/reports-analytics.types";
import {
  buildReportsAnalyticsInsightsFilename,
  generateReportsAnalyticsInsights,
  generateReportsAnalyticsInsightsPdf,
} from "./reports-analytics.insights.service";
import { fetchReportsAnalyticsDataset } from "./reports-analytics.server.service";

const UNIFIED_REPORT_TEMPLATE_VERSION = "premium-unified-v3";
const ORGANIZATION_REPORT_SCOPE = `template=${UNIFIED_REPORT_TEMPLATE_VERSION}`;

export interface OrganizationAnalyticsReportPayload {
  dataset: ReportsAnalyticsResponse;
  insights: ReportsAnalyticsAiInsights;
}

interface OrganizationAnalyticsDailyReportParams {
  organizationId: string;
  filters: ReportsAnalyticsFilters;
  locale: ReportsAnalyticsLocale;
  generatedByUserId?: string | null;
}

/**
 * Returns the single daily organization analytics document.
 *
 * El primer administrador que genera el corte fija los filtros y el idioma del
 * unico informe organizacional del dia. Las demas sesiones reutilizan el mismo
 * analisis y PDF; al dia siguiente se habilita un corte nuevo.
 */
export async function getOrganizationAnalyticsDailyReport(
  params: OrganizationAnalyticsDailyReportParams,
): Promise<DailyAiReportDocument> {
  const { organizationId, filters, locale, generatedByUserId } = params;

  return getOrCreateDailyAiReport({
    reportType: "org_reports_analytics",
    organizationId,
    locale,
    scopeKey: ORGANIZATION_REPORT_SCOPE,
    onePerOrganizationDay: true,
    isMetadataValid: (metadata) => readOrganizationAnalyticsReportPayload(metadata) !== null,
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
        metadata: {
          dataset: toPublicDataset(dataset),
          insights,
        } satisfies OrganizationAnalyticsReportPayload,
      };
    },
  });
}

/** Ultimo analisis visible, aun si pertenece a un dia anterior. */
export function getLatestOrganizationAnalyticsReportRecord(params: {
  organizationId: string;
  locale: ReportsAnalyticsLocale;
}): Promise<DailyAiReportRecord | null> {
  return getLatestDailyAiReportRecord({
    reportType: "org_reports_analytics",
    organizationId: params.organizationId,
    locale: params.locale,
    scopeKey: ORGANIZATION_REPORT_SCOPE,
    onePerOrganizationDay: true,
  });
}

/** Descarga exactamente el ultimo PDF generado, sin recalcular sus datos. */
export function getLatestOrganizationAnalyticsReportDocument(params: {
  organizationId: string;
  locale: ReportsAnalyticsLocale;
}): Promise<DailyAiReportDocument | null> {
  return getLatestDailyAiReport({
    reportType: "org_reports_analytics",
    organizationId: params.organizationId,
    locale: params.locale,
    scopeKey: ORGANIZATION_REPORT_SCOPE,
    onePerOrganizationDay: true,
  });
}

export function readOrganizationAnalyticsReportPayload(
  metadata: unknown,
): OrganizationAnalyticsReportPayload | null {
  if (!metadata || typeof metadata !== "object") return null;

  const candidate = metadata as Partial<OrganizationAnalyticsReportPayload>;
  if (
    !candidate.insights ||
    typeof candidate.insights.summary !== "string" ||
    !candidate.dataset ||
    candidate.dataset.success !== true ||
    !candidate.dataset.overview ||
    !candidate.dataset.period
  ) {
    return null;
  }

  return candidate as OrganizationAnalyticsReportPayload;
}

export function buildOrganizationAnalyticsReportScopeKey(
  _filters?: ReportsAnalyticsFilters,
): string {
  return ORGANIZATION_REPORT_SCOPE;
}

function toPublicDataset(dataset: ReportsAnalyticsDataset): ReportsAnalyticsResponse {
  const { userDetails: _userDetails, aiSamples: _aiSamples, ...publicDataset } = dataset;
  return publicDataset;
}
