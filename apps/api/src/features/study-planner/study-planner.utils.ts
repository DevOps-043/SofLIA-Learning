import type { NormalizedSessionListQuery, StudySessionListQuery } from './study-planner.types'

export function normalizeSessionListQuery(
  query: StudySessionListQuery,
): NormalizedSessionListQuery {
  const limit = query.limit ?? 50
  const offset = query.offset ?? 0

  return {
    planId: query.planId,
    status: query.status,
    startDate: query.startDate,
    endDate: query.endDate,
    orderBy: query.orderBy ?? 'start_time',
    orderDirection: query.orderDirection ?? 'asc',
    limit,
    offset,
    page: Math.floor(offset / limit) + 1,
  }
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit)
}

export function buildSessionUpdatePayload(
  data: Partial<{ title: string; startTime: string; endTime: string; status: string; notes: string }>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (data.title !== undefined) payload.title = data.title
  if (data.startTime !== undefined) payload.start_time = data.startTime
  if (data.endTime !== undefined) payload.end_time = data.endTime
  if (data.status !== undefined) payload.status = data.status
  if (data.notes !== undefined) payload.notes = data.notes

  return payload
}
