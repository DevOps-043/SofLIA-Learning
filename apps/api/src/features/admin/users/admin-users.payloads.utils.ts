import type { UsersTable } from '@/core/supabase/database/tables/users.table'
import type {
  AdminUserRoleUpdateInput,
  AdminUserUpdateInput,
} from './admin-users.types'

type UserUpdatePayload = UsersTable['Update']

export function buildAdminUserUpdatePayload(input: AdminUserUpdateInput): UserUpdatePayload {
  const nowIso = new Date().toISOString()
  const payload: UserUpdatePayload = { updated_at: nowIso }

  if ('username' in input && input.username !== undefined) payload.username = input.username
  if ('first_name' in input) payload.first_name = input.first_name ?? null
  if ('last_name' in input) payload.last_name = input.last_name ?? null
  if ('display_name' in input) payload.display_name = input.display_name ?? null
  if ('phone' in input) payload.phone = input.phone ?? null
  if ('bio' in input) payload.bio = input.bio ?? null
  if ('location' in input) payload.location = input.location ?? null
  if ('profile_picture_url' in input) payload.profile_picture_url = input.profile_picture_url ?? null
  if ('country_code' in input) payload.country_code = input.country_code ?? null
  if ('type_rol' in input) payload.type_rol = input.type_rol ?? null

  return payload
}

export function buildAdminUserRolePayload(input: AdminUserRoleUpdateInput): UserUpdatePayload {
  const payload: UserUpdatePayload = {
    platform_role: input.role,
    updated_at: new Date().toISOString(),
  }

  if ('type_rol' in input) {
    payload.type_rol = input.type_rol ?? null
  }

  return payload
}

export function buildAdminUserSoftDeletePayload(reason: string): UserUpdatePayload {
  const nowIso = new Date().toISOString()

  return {
    is_banned: true,
    banned_at: nowIso,
    ban_reason: reason,
    updated_at: nowIso,
  }
}
