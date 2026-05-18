export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 100

export interface PaginationParams {
  page: number
  pageSize: number
  rangeFrom: number
  rangeTo: number
}

export interface OffsetPaginationParams {
  limit: number
  offset: number
  rangeFrom: number
  rangeTo: number
}

export interface PaginationMetadata {
  hasNextPage: boolean
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function parsePositiveInteger(
  value: string | null,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  options?: { defaultPageSize?: number; maxPageSize?: number },
): PaginationParams {
  const pageSize = parsePositiveInteger(
    searchParams.get('pageSize') ?? searchParams.get('limit'),
    options?.defaultPageSize ?? DEFAULT_PAGE_SIZE,
    options?.maxPageSize ?? MAX_PAGE_SIZE,
  )
  const page = parsePositiveInteger(searchParams.get('page'), 1)
  const rangeFrom = (page - 1) * pageSize

  return {
    page,
    pageSize,
    rangeFrom,
    rangeTo: rangeFrom + pageSize - 1,
  }
}

export function parseOffsetPaginationParams(
  searchParams: URLSearchParams,
  options?: { defaultLimit?: number; maxLimit?: number },
): OffsetPaginationParams {
  const limit = parsePositiveInteger(
    searchParams.get('limit'),
    options?.defaultLimit ?? DEFAULT_PAGE_SIZE,
    options?.maxLimit ?? MAX_PAGE_SIZE,
  )
  const offset = Math.max(Number(searchParams.get('offset') ?? 0) || 0, 0)

  return {
    limit,
    offset,
    rangeFrom: offset,
    rangeTo: offset + limit - 1,
  }
}

export function buildPaginationMetadata(
  page: number,
  pageSize: number,
  total: number,
): PaginationMetadata {
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
  }
}
