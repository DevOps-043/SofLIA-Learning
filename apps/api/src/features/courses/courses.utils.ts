import type { CourseListQuery, NormalizedCourseListQuery } from './courses.types'

export function normalizeCourseListQuery(query: CourseListQuery): NormalizedCourseListQuery {
  const limit = query.limit ?? 50
  const offset = query.offset ?? 0

  return {
    category: query.category,
    level: query.level,
    search: query.search,
    isActive: query.isActive ?? true,
    orderBy: query.orderBy ?? 'created_at',
    orderDirection: query.orderDirection ?? 'desc',
    limit,
    offset,
    page: Math.floor(offset / limit) + 1,
  }
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit)
}
