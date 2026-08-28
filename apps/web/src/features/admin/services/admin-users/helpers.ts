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
  platform_role,
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
  last_login_at,
  last_activity_at,
  is_banned,
  banned_at,
  ban_reason
`

export const ADMIN_USER_LIST_SELECT_FIELDS = ADMIN_USER_SELECT_FIELDS

/** Tamano de pagina por defecto del directorio de usuarios. */
export const ADMIN_USERS_DEFAULT_PAGE_SIZE = 50

/**
 * Tope duro de filas por peticion. El cliente debe usar esta constante para
 * pedir como maximo lo que el servidor puede devolver: pedir mas se truncaba
 * en silencio y la UI creia tener el conjunto completo.
 */
export const ADMIN_USERS_MAX_PAGE_SIZE = 100

export function normalizeUsersPagination(options: GetUsersOptions = {}) {
  const page = options.page && options.page > 0 ? options.page : 1
  const limit =
    options.limit && options.limit > 0
      ? Math.min(options.limit, ADMIN_USERS_MAX_PAGE_SIZE)
      : ADMIN_USERS_DEFAULT_PAGE_SIZE
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

/**
 * Convierte un termino libre en un patron `ilike` seguro para el parser de
 * filtros de PostgREST.
 *
 * En `or=(col.op.valor,col.op.valor)` la coma separa condiciones y el parentesis
 * cierra el grupo, asi que un termino con esos caracteres alteraria la consulta
 * (buscar `a,platform_role.eq.Administrador` anadiria una condicion OR ajena).
 * Se entrecomilla el valor y se escapan `\` y `"`, que son los unicos caracteres
 * con significado dentro de las comillas.
 *
 * Nota: `%` y `_` siguen actuando como comodines de LIKE. Es intencional —
 * amplia la coincidencia, nunca la falsea, y `ilike` no expone clausula ESCAPE.
 */
export function buildPostgrestIlikePattern(search: string): string {
  const escaped = search.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `"%${escaped}%"`
}

export function buildAdminUserUpdatePayload(userData: Partial<AdminUser>) {
  const emptyToNull = (value: string | null | undefined): string | null =>
    value === '' || value === undefined ? null : value

  return {
    username: userData.username,
    first_name: emptyToNull(userData.first_name),
    last_name: emptyToNull(userData.last_name),
    display_name: emptyToNull(userData.display_name),
    platform_role: userData.platform_role,
    phone: emptyToNull(userData.phone),
    bio: emptyToNull(userData.bio),
    location: emptyToNull(userData.location),
    profile_picture_url: emptyToNull(userData.profile_picture_url),
    country_code: emptyToNull(userData.country_code),
    date_of_birth: normalizeDateOfBirthForStorage(userData.date_of_birth),
    gender: normalizeGenderForStorage(userData.gender),
    // Suspensión: banned_at/ban_reason solo se tocan cuando la petición trae
    // is_banned explícito; al reactivar se limpian ambos.
    is_banned: userData.is_banned,
    banned_at:
      userData.is_banned === undefined
        ? undefined
        : userData.is_banned
          ? new Date().toISOString()
          : null,
    ban_reason:
      userData.is_banned === undefined
        ? undefined
        : userData.is_banned
          ? emptyToNull(userData.ban_reason)
          : null,
    updated_at: new Date().toISOString(),
  }
}

export function buildAdminUserInsertPayload(
  userId: string,
  userData: AdminUserCreateInput,
) {
  return {
    id: userId,
    username: userData.username,
    email: userData.email,
    first_name: userData.first_name || null,
    last_name: userData.last_name || null,
    display_name: userData.display_name || null,
    platform_role: userData.platform_role,
    phone: userData.phone || null,
    bio: userData.bio || null,
    location: userData.location || null,
    profile_picture_url: userData.profile_picture_url || null,
    country_code: userData.country_code || null,
    date_of_birth: normalizeDateOfBirthForStorage(userData.date_of_birth),
    gender: normalizeGenderForStorage(userData.gender),
    email_verified: true,
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
