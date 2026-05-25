import type { ReportsAnalyticsUntypedFilterBuilder } from './reports-analytics-untyped-filter-builder'

export interface ReportsAnalyticsUntypedQueryBuilder {
  select(columns: string): ReportsAnalyticsUntypedFilterBuilder
}
