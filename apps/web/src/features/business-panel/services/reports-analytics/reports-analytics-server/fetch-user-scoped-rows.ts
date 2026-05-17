import { chunkArray } from './chunk-array'
import { fetchPagedRows } from './fetch-paged-rows'
import type { ReportsAnalyticsQueryResultLike } from './reports-analytics-query-result-like'

export async function fetchUserScopedRows<T>(
  label: string,
  userIds: string[],
  queryFactory: (userIdChunk: string[], from: number, to: number) => PromiseLike<ReportsAnalyticsQueryResultLike>,
): Promise<T[]> {
  if (userIds.length === 0) return []

  const chunkResults = await Promise.all(
    chunkArray(userIds, 300).map((chunk) =>
      fetchPagedRows<T>(label, (from, to) => queryFactory(chunk, from, to)),
    ),
  )

  return chunkResults.flat()
}
