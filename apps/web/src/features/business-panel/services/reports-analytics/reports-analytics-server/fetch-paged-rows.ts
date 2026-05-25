import { REPORTS_ANALYTICS_PAGE_SIZE } from './reports-analytics-page-size'
import { logQueryError } from './log-query-error'
import type { ReportsAnalyticsQueryResultLike } from './reports-analytics-query-result-like'

export async function fetchPagedRows<T>(
  label: string,
  queryFactory: (from: number, to: number) => PromiseLike<ReportsAnalyticsQueryResultLike>,
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const to = from + REPORTS_ANALYTICS_PAGE_SIZE - 1
    const result = await Promise.resolve(queryFactory(from, to))
    logQueryError(label, result.error)

    const pageRows = (result.data || []) as T[]
    rows.push(...pageRows)

    if (pageRows.length < REPORTS_ANALYTICS_PAGE_SIZE) break
    from += REPORTS_ANALYTICS_PAGE_SIZE
  }

  return rows
}
