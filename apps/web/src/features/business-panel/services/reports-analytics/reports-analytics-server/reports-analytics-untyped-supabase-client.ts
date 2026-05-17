import type { ReportsAnalyticsUntypedQueryBuilder } from './reports-analytics-untyped-query-builder'

export interface ReportsAnalyticsUntypedSupabaseClient {
  from(table: string): ReportsAnalyticsUntypedQueryBuilder
}
