import type {
  AdminUser,
  AdminUserListItem,
  AdminUserListQuery,
  AdminUserMembership,
  AdminUserRoleUpdateInput,
  AdminUserUpdateInput,
  NormalizedAdminUserListQuery,
} from './admin-users.types'

interface OrganizationRelation {
  name?: string | null
  slug?: string | null
}

export interface AdminUserMembershipRow {
  user_id: string
  organization_id: string
  role: string | null
  status: string | null
  organizations?: OrganizationRelation | OrganizationRelation[] | null
}

const SEARCH_SANITIZER_REGEX = /[^\p{L}\p{N}@._\-\s]/gu

function normalizeOptionalString(value?: string | null) {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : null
}

function sanitizeSearchTerm(value?: string) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return undefined
  }

  const sanitizedValue = trimmedValue
    .replace(SEARCH_SANITIZER_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return sanitizedValue || undefined
}

function resolveOrganizationRelation(
  organizations?: OrganizationRelation | OrganizationRelation[] | null,
) {
  if (Array.isArray(organizations)) {
    return organizations[0] ?? null
  }

  return organizations ?? null
}

export function normalizeAdminUserListQuery(
  query: AdminUserListQuery,
): NormalizedAdminUserListQuery {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  return {
    page,
    limit,
    from,
    to,
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

export function mapAdminUserMembershipRow(
  row: AdminUserMembershipRow,
): AdminUserMembership {
  const organization = resolveOrganizationRelation(row.organizations)

  return {
    organization_id: row.organization_id,
    organization_name: organization?.name ?? null,
    organization_slug: organization?.slug ?? null,
    role: row.role,
    status: row.status,
  }
}

export function groupMembershipsByUser(rows: AdminUserMembershipRow[]) {
  const membershipsByUser = new Map<string, AdminUserMembership[]>()

  for (const row of rows) {
    const currentMemberships = membershipsByUser.get(row.user_id) ?? []
    currentMemberships.push(mapAdminUserMembershipRow(row))
    membershipsByUser.set(row.user_id, currentMemberships)
  }

  return membershipsByUser
}

function getPrimaryMembership(memberships: AdminUserMembership[]) {
  return (
    memberships.find(
      (membership) => membership.status?.trim().toLowerCase() === 'active',
    ) ??
    memberships[0] ??
    null
  )
}

export function mapAdminUserListItems(
  users: AdminUser[],
  membershipsByUser: Map<string, AdminUserMembership[]>,
): AdminUserListItem[] {
  return users.map((user) => {
    const primaryMembership = getPrimaryMembership(
      membershipsByUser.get(user.id) ?? [],
    )

    return {
      ...user,
      organization_name: primaryMembership?.organization_name ?? null,
      organization_slug: primaryMembership?.organization_slug ?? null,
      organization_role: primaryMembership?.role ?? null,
      membership_status: primaryMembership?.status ?? null,
    }
  })
}

export function buildAdminUserUpdatePayload(input: AdminUserUpdateInput) {
  const nowIso = new Date().toISOString()
  const payload: Record<string, unknown> = {
    updated_at: nowIso,
  }

  if ('username' in input) {
    payload.username = input.username
  }
  if ('email' in input) {
    payload.email = input.email
  }
  if ('first_name' in input) {
    payload.first_name = input.first_name
  }
  if ('last_name' in input) {
    payload.last_name = input.last_name
  }
  if ('display_name' in input) {
    payload.display_name = input.display_name
  }
  if ('email_verified' in input) {
    payload.email_verified = input.email_verified
    payload.email_verified_at = input.email_verified ? nowIso : null
  }
  if ('phone' in input) {
    payload.phone = input.phone
  }
  if ('bio' in input) {
    payload.bio = input.bio
  }
  if ('location' in input) {
    payload.location = input.location
  }
  if ('profile_picture_url' in input) {
    payload.profile_picture_url = input.profile_picture_url
  }
  if ('country_code' in input) {
    payload.country_code = input.country_code
  }
  if ('type_rol' in input) {
    payload.type_rol = input.type_rol
  }

  return payload
}

export function buildAdminUserRolePayload(input: AdminUserRoleUpdateInput) {
  const payload: Record<string, unknown> = {
    cargo_rol: input.role,
    updated_at: new Date().toISOString(),
  }

  if ('type_rol' in input) {
    payload.type_rol = input.type_rol ?? null
  }

  return payload
}

export function buildAdminUserSoftDeletePayload(reason: string) {
  const nowIso = new Date().toISOString()

  return {
    is_banned: true,
    banned_at: nowIso,
    ban_reason: reason,
    updated_at: nowIso,
  }
}

export function calculateTotalPages(total: number, limit: number) {
  return total === 0 ? 0 : Math.ceil(total / limit)
}
