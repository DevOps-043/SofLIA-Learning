import type {
  FavoriteQueryRow,
  PurchaseQueryRow,
  QueryResult,
} from './course-query.types'

export function extractFavoriteCourseIds(
  result: QueryResult<FavoriteQueryRow> | null | undefined,
): string[] {
  if (!result?.data || result.error) {
    return []
  }

  return result.data.map((favorite) => favorite.course_id)
}

export function extractPurchasedCourseIds(
  result: QueryResult<PurchaseQueryRow> | null | undefined,
): string[] {
  if (!result?.data || result.error) {
    return []
  }

  const activePurchases = result.data
    .filter((purchase) => purchase.access_status === 'active')
    .map((purchase) => purchase.course_id)

  return activePurchases.length > 0
    ? activePurchases
    : result.data.map((purchase) => purchase.course_id)
}
