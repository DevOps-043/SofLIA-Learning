import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireBusiness } from "@/lib/auth/requireBusiness";
import { apiError } from "@/lib/api/errors";
import { withZodBody } from "@/lib/api/with-validation";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { fetchReportsAnalyticsDataset } from "@/features/business-panel/services/reports-analytics/reports-analytics.server.service";
import {
  buildReportsAnalyticsFilename,
  generateReportsAnalyticsWorkbook,
  generateReportsAnalyticsZip,
} from "@/features/business-panel/services/reports-analytics/reports-analytics.export.service";
import { getOrganizationAnalyticsDailyReport } from "@/features/business-panel/services/reports-analytics/org-analytics-daily-report.server.service";
import { generateReportsAnalyticsReportBlueprint } from "@/features/business-panel/services/reports-analytics/reports-analytics.blueprint.service";
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsFilters,
} from "@/features/business-panel/types/reports-analytics.types";
import {
  reportsAnalyticsExportSchema,
  reportsAnalyticsQuerySchema,
  type ReportsAnalyticsExportBody,
  type ReportsAnalyticsQueryBody,
} from "../_schemas";

export const runtime = "nodejs";

type CachedDataset = { dataset: ReportsAnalyticsDataset; expiresAt: number };
const analyticsCache = new Map<string, CachedDataset>();
const ANALYTICS_CACHE_TTL_MS = 5 * 60 * 1000;

function buildCacheKey(
  organizationId: string,
  filters: ReportsAnalyticsFilters,
): string {
  return `${organizationId}|${filters.from}|${filters.to}|${filters.granularity}|${filters.courseId ?? ""}|${filters.regionId ?? ""}|${filters.zoneId ?? ""}|${filters.teamId ?? ""}|${filters.gender ?? ""}|${filters.ageBand ?? ""}|${filters.jobTitle ?? ""}|${filters.role ?? ""}|${filters.status ?? ""}`;
}

function getCachedDataset(key: string): ReportsAnalyticsDataset | null {
  const entry = analyticsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    analyticsCache.delete(key);
    return null;
  }
  return entry.dataset;
}

function setCachedDataset(key: string, dataset: ReportsAnalyticsDataset): void {
  if (analyticsCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of analyticsCache) {
      if (now > v.expiresAt) analyticsCache.delete(k);
    }
  }
  analyticsCache.set(key, {
    dataset,
    expiresAt: Date.now() + ANALYTICS_CACHE_TTL_MS,
  });
}

type RouteContext = {
  params: Promise<{ orgSlug: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;
    if (!auth.organizationId) return forbiddenResponse();

    const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);
    const cacheKey = buildCacheKey(auth.organizationId, filters);
    const cached = getCachedDataset(cacheKey);

    let dataset: ReportsAnalyticsDataset;
    if (cached) {
      dataset = cached;
    } else {
      const supabase = await createClient();
      dataset = await fetchReportsAnalyticsDataset(
        supabase,
        auth.organizationId,
        filters,
      );
      setCachedDataset(cacheKey, dataset);
    }

    const {
      userDetails: _userDetails,
      aiSamples: _aiSamples,
      ...publicDataset
    } = dataset;

    return NextResponse.json(publicDataset, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    logger.error("Reports analytics GET failed", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener analytics" },
      { status: 500 },
    );
  }
}

async function handlePost(
  _request: NextRequest,
  body: ReportsAnalyticsExportBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;
    if (!auth.organizationId) return forbiddenResponse();

    const filters = normalizeFilters(body);
    const locale = body.locale || "es";

    if (body.format === "pdf") {
      const document = await getOrganizationAnalyticsDailyReport({
        organizationId: auth.organizationId,
        filters,
        locale,
        generatedByUserId: auth.userId,
      });

      return buildFileResponse(
        document.bytes,
        document.fileName,
        "application/pdf",
        {
          "X-Daily-Report-Reused": document.reused ? "1" : "0",
          "X-Daily-Report-Date": document.reportDate,
        },
      );
    }

    const supabase = await createClient();
    const dataset = await fetchReportsAnalyticsDataset(
      supabase,
      auth.organizationId,
      filters,
    );
    const blueprint = await generateReportsAnalyticsReportBlueprint({
      dataset,
      locale,
      format: body.format,
      requestedByUserId: auth.userId,
    });

    if (body.format === "xlsx") {
      const file = await generateReportsAnalyticsWorkbook(
        dataset,
        locale,
        blueprint,
      );
      return buildFileResponse(
        file,
        buildReportsAnalyticsFilename("xlsx", dataset),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    }

    const file = await generateReportsAnalyticsZip(dataset, locale, blueprint);
    return buildFileResponse(
      file,
      buildReportsAnalyticsFilename("zip", dataset),
      "application/zip",
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        "VALIDATION_ERROR",
        "Filtros de analytics invalidos",
        400,
      );
    }

    logger.error("Reports analytics export failed", error);
    return apiError("REPORT_EXPORT_FAILED", "Error al generar reporte", 500);
  }
}

export const POST = withZodBody(reportsAnalyticsExportSchema, handlePost);

function parseFiltersFromSearchParams(
  searchParams: URLSearchParams,
): ReportsAnalyticsFilters {
  const parsed = reportsAnalyticsQuerySchema.parse({
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    granularity: searchParams.get("granularity") || undefined,
    courseId: searchParams.get("courseId") || undefined,
    gender: searchParams.get("gender") || undefined,
    ageBand: searchParams.get("ageBand") || undefined,
    jobTitle: searchParams.get("jobTitle") || undefined,
    role: searchParams.get("role") || undefined,
    status: searchParams.get("status") || undefined,
    regionId: searchParams.get("regionId") || undefined,
    zoneId: searchParams.get("zoneId") || undefined,
    teamId: searchParams.get("teamId") || undefined,
  });

  return normalizeFilters(parsed);
}

function normalizeFilters(
  input: ReportsAnalyticsQueryBody,
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

function buildFileResponse(
  file: Uint8Array,
  filename: string,
  contentType: string,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  const body = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  ) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      ...extraHeaders,
    },
  });
}

function forbiddenResponse(): NextResponse {
  return apiError(
    "NO_ORGANIZATION",
    "No tienes una organizacion asignada",
    403,
  );
}
