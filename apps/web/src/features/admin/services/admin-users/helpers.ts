import type {
  AdminUser,
  AdminUserCreateInput,
  GetUsersOptions,
} from './types'
import {
  calculateAgeFromDateOfBirth,
  normalizeDateOfBirthForStorage,
  normalizeGenderForStorage,
} from '../../../../lib/schemas/user-demographics.schema'

export const ADMIN_USER_SELECT_FIELDS = `
  id,
  username,
  email,
  first_name,
  last_name,
  display_name,
  cargo_rol,
  type_rol,
  email_verified,
  email_verified_at,
  phone,
  bio,
  location,
  profile_picture_url,
  country_code,
  date_of_birth,
  gender,
  created_at,
  updated_at,
  last_login_at
`

export const ADMIN_USER_LIST_SELECT_FIELDS = ADMIN_USER_SELECT_FIELDS

export function normalizeUsersPagination(options: GetUsersOptions = {}) {
  const page = options.page && options.page > 0 ? options.page : 1
  const limit =
    options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  return {
    page,
    limit,
    from,
    to,
    search: options.search?.trim() || undefined,
  }
}

export function buildAdminUserUpdatePayload(userData: Partial<AdminUser>) {
  const emptyToNull = (value: string | null | undefined): string | null =>
    value === '' || value === undefined ? null : value

  return {
    username: userData.username,
    email: userData.email,
    first_name: emptyToNull(userData.first_name),
    last_name: emptyToNull(userData.last_name),
    display_name: emptyToNull(userData.display_name),
    cargo_rol: userData.cargo_rol,
    type_rol: emptyToNull(userData.type_rol),
    email_verified: userData.email_verified,
    email_verified_at: userData.email_verified
      ? new Date().toISOString()
      : userData.email_verified_at,
    phone: emptyToNull(userData.phone),
    bio: emptyToNull(userData.bio),
    location: emptyToNull(userData.location),
    profile_picture_url: emptyToNull(userData.profile_picture_url),
    country_code: emptyToNull(userData.country_code),
    date_of_birth: normalizeDateOfBirthForStorage(userData.date_of_birth),
    gender: normalizeGenderForStorage(userData.gender),
    updated_at: new Date().toISOString(),
  }
}

export function buildAdminUserInsertPayload(
  userId: string,
  userData: AdminUserCreateInput,
  passwordHash: string,
) {
  return {
    id: userId,
    username: userData.username,
    email: userData.email,
    password_hash: passwordHash,
    first_name: userData.first_name || null,
    last_name: userData.last_name || null,
    display_name: userData.display_name || null,
    cargo_rol: userData.cargo_rol,
    type_rol: userData.type_rol || null,
    phone: userData.phone || null,
    bio: userData.bio || null,
    location: userData.location || null,
    profile_picture_url: userData.profile_picture_url || null,
    country_code: userData.country_code || null,
    date_of_birth: normalizeDateOfBirthForStorage(userData.date_of_birth),
    gender: normalizeGenderForStorage(userData.gender),
    email_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function mapAdminUserWithAge(user: AdminUser): AdminUser {
  return {
    ...user,
    age: calculateAgeFromDateOfBirth(user.date_of_birth),
  }
}

export function omitDemographicsFromAudit(
  values: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!values) {
    return undefined
  }

  const sanitizedValues = { ...values }
  delete sanitizedValues.date_of_birth
  delete sanitizedValues.gender
  delete sanitizedValues.age

  return sanitizedValues
}

export function mapAdminUserCreateError(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null
  }

  const pgError = error as {
    code?: string
    message?: string
    details?: string
    constraint?: string
  }

  if (pgError.code !== '23505') {
    return null
  }

  const message = (
    pgError.constraint ||
    pgError.details ||
    pgError.message ||
    ''
  ).toLowerCase()

  if (message.includes('email')) {
    return 'El correo electronico ya esta registrado en la plataforma. Este usuario existe en otra empresa.'
  }

  if (message.includes('username')) {
    return 'El nombre de usuario ya esta en uso. Por favor elige otro nombre de usuario.'
  }

  return 'Ya existe un usuario con esos datos.'
}
