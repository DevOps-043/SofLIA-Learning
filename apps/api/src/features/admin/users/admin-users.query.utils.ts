import type {
  AdminUserListQuery,
  NormalizedAdminUserListQuery,
} from './admin-users.types'

const SEARCH_SANITIZER_REGEX = /[^\p{L}\p{N}@._\-\s]/gu

function normalizeOptionalString(value?: string | null) {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : null
}

function sanitizeSearchTerm(value?: string) {
  const trimmedValue = value?.trim()
  if (!trimmedValue) return undefined

  const sanitizedValue = trimmedValue
    .replace(SEARCH_SANITIZER_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return sanitizedValue || undefined
}

export function normalizeAdminUserListQuery(
  query: AdminUserListQuery,
): NormalizedAdminUserListQuery {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const from = (page - 1) * limit

  return {
    page,
    limit,
    from,
    to: from + limit - 1,
    search: sanitizeSearchTerm(query.search),
    role: normalizeOptionalString(query.role) ?? undefined,
    status: query.status,
    activeSinceIso: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }
}

export function buildAdminUsersSearchFilter(search: string) {
  return [
    `username.ilike.%${search}%`,
    `email.ilike.%${search}%`,
    `first_name.ilike.%${search}%`,
    `last_name.ilike.%${search}%`,
    `display_name.ilike.%${search}%`,
  ].join(',')
}

export function calculateTotalPages(total: number, limit: number) {
  return total === 0 ? 0 : Math.ceil(total / limit)
}
