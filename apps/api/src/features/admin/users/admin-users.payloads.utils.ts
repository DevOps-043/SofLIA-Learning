import type {
  AdminUserRoleUpdateInput,
  AdminUserUpdateInput,
} from './admin-users.types'

export function buildAdminUserUpdatePayload(input: AdminUserUpdateInput) {
  const nowIso = new Date().toISOString()
  const payload: Record<string, unknown> = { updated_at: nowIso }

  setIfPresent(payload, input, 'username')
  setIfPresent(payload, input, 'email')
  setIfPresent(payload, input, 'first_name')
  setIfPresent(payload, input, 'last_name')
  setIfPresent(payload, input, 'display_name')
  setIfPresent(payload, input, 'phone')
  setIfPresent(payload, input, 'bio')
  setIfPresent(payload, input, 'location')
  setIfPresent(payload, input, 'profile_picture_url')
  setIfPresent(payload, input, 'country_code')
  setIfPresent(payload, input, 'type_rol')

  if ('email_verified' in input) {
    payload.email_verified = input.email_verified
    payload.email_verified_at = input.email_verified ? nowIso : null
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

function setIfPresent<T extends Record<string, unknown>>(
  target: Record<string, unknown>,
  source: T,
  key: keyof T,
) {
  if (key in source) {
    target[String(key)] = source[key]
  }
}
