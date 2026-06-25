import { REPORTS_ANALYTICS_PAGE_SIZE } from './reports-analytics-page-size'
import { logQueryError } from './log-query-error'
import type { ReportsAnalyticsQueryResultLike } from './reports-analytics-query-result-like'

const PARALLEL_BATCH_SIZE = 5

export async function fetchPagedRows<T>(
  label: string,
  queryFactory: (from: number, to: number) => PromiseLike<ReportsAnalyticsQueryResultLike>,
): Promise<T[]> {
  const rows: T[] = []

  // Fetch first page to determine if there's more data before parallelizing
  const firstResult = await Promise.resolve(queryFactory(0, REPORTS_ANALYTICS_PAGE_SIZE - 1))
  logQueryError(label, firstResult.error)

  const firstPage = (firstResult.data || []) as T[]
  rows.push(...firstPage)

  if (firstPage.length < REPORTS_ANALYTICS_PAGE_SIZE) return rows

  // Data exceeds one page — fetch subsequent pages in parallel batches
  let batchStart = 1
  while (true) {
    const pageIndices = Array.from({ length: PARALLEL_BATCH_SIZE }, (_, i) => batchStart + i)
    const batchResults = await Promise.all(
      pageIndices.map((pageIndex) => {
        const from = pageIndex * REPORTS_ANALYTICS_PAGE_SIZE
        const to = from + REPORTS_ANALYTICS_PAGE_SIZE - 1
        return Promise.resolve(queryFactory(from, to))
      }),
    )

    let reachedEnd = false
    for (const result of batchResults) {
      logQueryError(label, result.error)
      const pageRows = (result.data || []) as T[]
      rows.push(...pageRows)
      if (pageRows.length < REPORTS_ANALYTICS_PAGE_SIZE) {
        reachedEnd = true
        break
      }
    }

    if (reachedEnd) break
    batchStart += PARALLEL_BATCH_SIZE
  }

  return rows
}
