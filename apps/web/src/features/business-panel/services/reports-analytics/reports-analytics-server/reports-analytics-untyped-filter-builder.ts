import type { ReportsAnalyticsQueryResultLike } from './reports-analytics-query-result-like'

export interface ReportsAnalyticsUntypedFilterBuilder extends PromiseLike<ReportsAnalyticsQueryResultLike> {
  eq(column: string, value: unknown): ReportsAnalyticsUntypedFilterBuilder
  range(from: number, to: number): PromiseLike<ReportsAnalyticsQueryResultLike>
}
