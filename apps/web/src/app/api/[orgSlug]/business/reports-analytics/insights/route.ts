import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError } from "@/lib/api/errors";
import { requireBusiness } from "@/lib/auth/requireBusiness";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { withZodBody } from "@/lib/api/with-validation";
import { getOrganizationAnalyticsDailyReport } from "@/features/business-panel/services/reports-analytics/org-analytics-daily-report.server.service";
import { generateReportsAnalyticsInsights } from "@/features/business-panel/services/reports-analytics/reports-analytics.insights.service";
import { fetchReportsAnalyticsDataset } from "@/features/business-panel/services/reports-analytics/reports-analytics.server.service";
import type {
  ReportsAnalyticsFilters,
  ReportsAnalyticsLocale,
} from "@/features/business-panel/types/reports-analytics.types";

import {
  reportsAnalyticsInsightsSchema,
  type ReportsAnalyticsInsightsBody,
} from "../../_schemas";

// El análisis con Gemini puede tardar decenas de segundos. El timeout interno
// cae al análisis de respaldo antes de que la plataforma interrumpa la ruta.
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ orgSlug: string }>;
};

async function handlePost(
  _request: NextRequest,
  body: ReportsAnalyticsInsightsBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;
    if (!auth.organizationId) return forbiddenResponse();

    const filters = normalizeFilters(body);
    const locale: ReportsAnalyticsLocale = body.locale || "es";

    if (body.format === "pdf") {
      // Esta es exactamente la misma operación que usa "Descargar PDF". El
      // servicio diario resuelve un único documento por ámbito, filtros y día.
      const document = await getOrganizationAnalyticsDailyReport({
        organizationId: auth.organizationId,
        filters,
        locale,
        generatedByUserId: auth.userId,
      });

      const responseBody = document.bytes.buffer.slice(
        document.bytes.byteOffset,
        document.bytes.byteOffset + document.bytes.byteLength,
      ) as ArrayBuffer;

      return new NextResponse(responseBody, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${document.fileName}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "X-Daily-Report-Reused": document.reused ? "1" : "0",
          "X-Daily-Report-Date": document.reportDate,
        },
      });
    }

    const supabase = await createClient();
    const dataset = await fetchReportsAnalyticsDataset(
      supabase,
      auth.organizationId,
      filters,
    );
    const insights = await generateReportsAnalyticsInsights({
      dataset,
      locale,
      requestedByUserId: auth.userId,
    });

    return NextResponse.json(
      { success: true, insights },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        "VALIDATION_ERROR",
        "Filtros de analytics invalidos",
        400,
      );
    }

    logger.error("Reports analytics insights failed", error);
    return apiError(
      "REPORT_INSIGHTS_FAILED",
      "Error al generar analisis IA",
      500,
    );
  }
}

export const POST = withZodBody(reportsAnalyticsInsightsSchema, handlePost);

function normalizeFilters(
  input: ReportsAnalyticsInsightsBody,
): ReportsAnalyticsFilters {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 90);

  const from = normalizeDate(input.from, defaultFrom, false);
  const to = normalizeDate(input.to, now, true);

  return {
    from,
    to,
    granularity: input.granularity || "month",
    courseId: input.courseId,
    gender: input.gender,
    ageBand: input.ageBand,
    jobTitle: input.jobTitle,
    role: input.role,
    status: input.status,
    regionId: input.regionId,
    zoneId: input.zoneId,
    teamId: input.teamId,
  };
}

function normalizeDate(
  value: string | undefined,
  fallback: Date,
  endOfDay: boolean,
): string {
  const date = value ? new Date(value) : new Date(fallback);
  if (Number.isNaN(date.getTime())) {
    throw new ZodError([]);
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
}

function forbiddenResponse(): NextResponse {
  return apiError(
    "NO_ORGANIZATION",
    "No tienes una organizacion asignada",
    403,
  );
}
