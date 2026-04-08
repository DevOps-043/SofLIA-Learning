import type {
  BusinessUser,
  BusinessUserStats,
  CreateBusinessUserRequest,
  UpdateBusinessUserRequest,
} from '../businessUsers.service'
import type {
  BulkInviteUsageRow,
  CreateUserErrorShape,
  OrganizationRole,
  OrganizationStatus,
  OrganizationUserSummaryRow,
  OrganizationUserUpdateRow,
  OrganizationUserWithProfileRow,
  PendingInvitationRow,
  UserInsertRow,
  UserUpdateRow,
} from './types'

export const BUSINESS_USER_SELECT = `
  organization_id,
  user_id,
  role,
  job_title,
  status,
  joined_at,
  users:users!organization_users_user_id_fkey (
    id,
    username,
    email,
    first_name,
    last_name,
    display_name,
    cargo_rol,
    email_verified,
    profile_picture_url,
    bio,
    location,
    phone,
    last_login_at,
    created_at,
    updated_at
  )
`

export function normalizeOrganizationRole(
  role: string | null | undefined,
): OrganizationRole {
  if (role === 'owner' || role === 'admin' || role === 'member') {
    return role
  }

  return 'member'
}

export function normalizeOrganizationStatus(
  status: string | null | undefined,
): OrganizationStatus {
  if (
    status === 'active' ||
    status === 'invited' ||
    status === 'suspended' ||
    status === 'removed'
  ) {
    return status
  }

  return 'active'
}

function getJoinedProfile(
  value: OrganizationUserWithProfileRow['users'],
): OrganizationUserWithProfileRow['users'] extends Array<infer T> ? T : never {
  if (Array.isArray(value)) {
    return (value[0] ?? null) as never
  }

  return value as never
}

export function mapOrganizationUserRecord(
  record: OrganizationUserWithProfileRow,
): BusinessUser | null {
  const profile = getJoinedProfile(record.users)

  if (!profile) {
    return null
  }

  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    display_name: profile.display_name,
    cargo_rol: profile.cargo_rol ?? 'Business',
    job_title: record.job_title,
    organization_id: record.organization_id,
    email_verified: Boolean(profile.email_verified),
    profile_picture_url: profile.profile_picture_url,
    bio: profile.bio,
    location: profile.location,
    phone: profile.phone,
    points: 0,
    last_login_at: profile.last_login_at,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    org_role: normalizeOrganizationRole(record.role),
    org_status: normalizeOrganizationStatus(record.status),
    joined_at: record.joined_at ?? undefined,
  }
}

export function buildOrganizationStats(
  orgUsers: OrganizationUserSummaryRow[] = [],
  pendingInvitations: PendingInvitationRow[] = [],
  bulkLinks: BulkInviteUsageRow[] = [],
): BusinessUserStats {
  const activeUsers = orgUsers.filter((user) => user.status === 'active').length
  const invitedUsers =
    orgUsers.filter((user) => user.status === 'invited').length +
    pendingInvitations.length
  const suspendedUsers = orgUsers.filter(
    (user) => user.status === 'suspended',
  ).length
  const admins =
    orgUsers.filter(
      (user) => user.role === 'admin' || user.role === 'owner',
    ).length +
    pendingInvitations.filter(
      (invitation) =>
        invitation.role === 'admin' || invitation.role === 'owner',
    ).length
  const members =
    orgUsers.filter((user) => user.role === 'member').length +
    pendingInvitations.filter((invitation) => invitation.role === 'member')
      .length
  const bulkLinkUsage = bulkLinks.reduce(
    (sum, link) => sum + (link.current_uses ?? 0),
    0,
  )

  return {
    total: orgUsers.length + pendingInvitations.length,
    active: activeUsers,
    invited: invitedUsers,
    suspended: suspendedUsers,
    admins,
    members,
    bulk_link_usage: bulkLinkUsage,
  }
}

function assertNonEmptyValue(value: string | undefined, message: string): string {
  if (!value || !value.trim()) {
    throw new Error(message)
  }

  return value.trim()
}

export function validateCreateBusinessUserRequest(
  userData: CreateBusinessUserRequest,
) {
  const password = assertNonEmptyValue(
    userData.password,
    'La contrasena es obligatoria',
  )

  if (password.length < 6) {
    throw new Error('La contrasena debe tener al menos 6 caracteres')
  }

  assertNonEmptyValue(userData.job_title, 'El cargo/puesto es obligatorio')
}

export function buildUserInsertData(
  userData: CreateBusinessUserRequest,
  passwordHash: string,
): UserInsertRow {
  return {
    username: userData.username,
    email: userData.email,
    first_name: userData.first_name ?? null,
    last_name: userData.last_name ?? null,
    display_name: userData.display_name ?? null,
    cargo_rol: 'Business',
    password_hash: passwordHash,
  }
}

export function buildOrganizationUserInsertData(
  organizationId: string,
  userId: string,
  userData: CreateBusinessUserRequest,
  createdBy: string,
  nowIso: string,
) {
  return {
    organization_id: organizationId,
    user_id: userId,
    role: normalizeOrganizationRole(userData.org_role),
    job_title: userData.job_title.trim(),
    status: 'active' as const,
    invited_by: createdBy,
    invited_at: nowIso,
    joined_at: nowIso,
  }
}

export function buildUserUpdateData(
  userData: UpdateBusinessUserRequest,
): UserUpdateRow {
  const updateData: UserUpdateRow = {}

  if (userData.first_name !== undefined) updateData.first_name = userData.first_name
  if (userData.last_name !== undefined) updateData.last_name = userData.last_name
  if (userData.display_name !== undefined) {
    updateData.display_name = userData.display_name
  }
  if (userData.email !== undefined) updateData.email = userData.email
  if (userData.cargo_rol !== undefined) updateData.cargo_rol = userData.cargo_rol
  if (userData.profile_picture_url !== undefined) {
    updateData.profile_picture_url = userData.profile_picture_url
  }
  if (userData.bio !== undefined) updateData.bio = userData.bio
  if (userData.location !== undefined) updateData.location = userData.location
  if (userData.phone !== undefined) updateData.phone = userData.phone

  return updateData
}

export function buildOrganizationUserUpdateData(
  userData: UpdateBusinessUserRequest,
): OrganizationUserUpdateRow {
  const updateData: OrganizationUserUpdateRow = {}

  if (userData.org_role !== undefined) {
    updateData.role = normalizeOrganizationRole(userData.org_role)
  }
  if (userData.job_title !== undefined) updateData.job_title = userData.job_title
  if (userData.org_status !== undefined) {
    updateData.status = normalizeOrganizationStatus(userData.org_status)
  }

  return updateData
}

export function mapCreateOrganizationUserError(error: unknown): Error | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const pgError = error as CreateUserErrorShape
  if (pgError.code !== '23505') {
    return null
  }

  const constraintHint = (
    pgError.constraint ||
    pgError.details ||
    pgError.message ||
    ''
  ).toLowerCase()

  if (constraintHint.includes('email')) {
    return new Error(
      'El correo electronico ya esta registrado en la plataforma. Este usuario existe en otra empresa.',
    )
  }

  if (constraintHint.includes('username')) {
    return new Error(
      'El nombre de usuario ya esta en uso. Por favor elige otro nombre de usuario.',
    )
  }

  return new Error(
    'Este usuario ya existe en la plataforma (correo o usuario duplicado). Por favor verifica los datos.',
  )
}

export function shouldAutoAssignToDefaultTeam(
  role: BusinessUser['org_role'] | undefined,
): boolean {
  return normalizeOrganizationRole(role) === 'member'
}

export function hasHierarchyAutoAssignEnabled(
  config: Record<string, unknown> | null | undefined,
): boolean {
  return Boolean(config?.auto_assign_new_users)
}
