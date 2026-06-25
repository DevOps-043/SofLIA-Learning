import type { ReportsAnalyticsDataset, ReportsAnalyticsFilters } from '../../../types/reports-analytics.types'
import { buildReportsAnalyticsDataset } from './build-reports-analytics-dataset'
import { fetchReportsAnalyticsQueryData } from './fetch-reports-analytics-query-data'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export async function fetchReportsAnalyticsDataset(
  supabase: ReportsAnalyticsSupabaseClient,
  organizationId: string,
  filters: ReportsAnalyticsFilters,
): Promise<ReportsAnalyticsDataset> {
  const queryData = await fetchReportsAnalyticsQueryData(supabase, organizationId, filters)
  return buildReportsAnalyticsDataset(queryData, filters)
}
