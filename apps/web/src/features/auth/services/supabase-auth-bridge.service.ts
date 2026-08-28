import 'server-only'

import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmailAppUrl } from './email.utils'

export interface LegacyUserForAuthBridge {
  platform_role?: string | null
  display_name?: string | null
  email: string | null
  email_verified?: boolean | null
  first_name?: string | null
  id: string
  last_name?: string | null
  profile_picture_url?: string | null
  username?: string | null
}

export interface NewAuthUserInput extends LegacyUserForAuthBridge {
  email: string
  password: string
}

export interface NewGeneratedAuthUserInput extends Omit<NewAuthUserInput, 'id'> {
  id?: never
}

export interface AuthUserRecordInput extends LegacyUserForAuthBridge {
  email: string
}

export interface GeneratedAuthUserRecordInput extends Omit<AuthUserRecordInput, 'id'> {
  id?: never
}

interface CreateAuthUserOptions {
  password?: string
}

type RpcClient = {
  rpc<T>(
    fn: string,
    params?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: { message: string } | null }>
}

export class SupabaseAuthBridgeError extends Error {
  constructor(
    readonly code:
      | 'AUTH_USER_CREATE_FAILED'
      | 'AUTH_USER_ID_MISMATCH'
      | 'AUTH_USER_LOOKUP_FAILED'
      | 'AUTH_USER_NOT_FOUND'
      | 'MISSING_EMAIL',
    message: string,
  ) {
    super(message)
    this.name = 'SupabaseAuthBridgeError'
  }
}

/**
 * Devuelve el usuario de Supabase Auth correspondiente al perfil.
 *
 * Antes, si no existía, lo CREABA migrando el bcrypt de `users.password_hash`.
 * Esa migración ya terminó: los 30 usuarios tienen credenciales en `auth.users`
 * (verificado: 0 filas sin `encrypted_password`) y la columna se ha eliminado.
 * Si a estas alturas falta el usuario de Auth, es una inconsistencia real que
 * hay que ver, no algo que se pueda arreglar solo: se falla de forma explícita.
 */
export async function ensureSupabaseAuthUserForLegacyProfile(
  profile: LegacyUserForAuthBridge,
) {
  const existingUser = await findExistingAuthUser(profile)
  if (existingUser) {
    return existingUser
  }

  throw new SupabaseAuthBridgeError(
    'AUTH_USER_NOT_FOUND',
    'El perfil no tiene usuario correspondiente en Supabase Auth.',
  )
}

export async function ensureSupabaseAuthUserRecordForLegacyProfile(
  profile: LegacyUserForAuthBridge,
) {
  const existingUser = await findExistingAuthUser(profile)
  if (existingUser) {
    return existingUser
  }

  // Sin contraseña: crea el registro en Auth para un perfil que aún no lo tiene
  // (p. ej. altas por importación). La contraseña se establece después, por
  // invitación o restablecimiento.
  return createAuthUserWithLegacyId(profile, {})
}

async function findExistingAuthUser(profile: LegacyUserForAuthBridge) {
  const email = normalizeEmail(profile.email)
  if (!email) {
    throw new SupabaseAuthBridgeError(
      'MISSING_EMAIL',
      'El usuario legacy no tiene email para migrar a Supabase Auth.',
    )
  }

  const admin = createAdminClient()
  const existingById = await admin.auth.admin.getUserById(profile.id)

  if (existingById.data.user) {
    return existingById.data.user
  }

  if (existingById.error && !isMissingAuthUserError(existingById.error)) {
    throw new SupabaseAuthBridgeError(
      'AUTH_USER_LOOKUP_FAILED',
      existingById.error.message,
    )
  }

  return null
}

export async function createSupabaseAuthUserWithLegacyId(
  input: NewAuthUserInput,
) {
  return createAuthUserWithLegacyId(input, { password: input.password })
}

export async function createSupabaseAuthUser(
  input: NewGeneratedAuthUserInput,
) {
  return createAuthUser(input, { password: input.password })
}

export async function createSupabaseAuthUserRecordWithLegacyId(
  input: AuthUserRecordInput,
) {
  return createAuthUserWithLegacyId(input, {})
}

export async function createSupabaseAuthUserRecord(
  input: GeneratedAuthUserRecordInput,
) {
  return createAuthUser(input, {})
}

export async function deleteSupabaseAuthUser(userId: string) {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error && !isMissingAuthUserError(error)) {
    logger.warn('No se pudo eliminar usuario Auth durante rollback', {
      error: error.message,
      userId,
    })
  }
}

export async function revokeSupabaseAuthSessions(userId: string) {
  const admin = createAdminClient()
  const rpcClient = admin as unknown as RpcClient
  const { data, error } = await rpcClient.rpc<number>('revoke_auth_sessions', {
    target_user_id: userId,
  })

  if (error) {
    logger.warn('No se pudieron revocar sesiones nativas de Supabase Auth', {
      error: error.message,
      userId,
    })
    return 0
  }

  return typeof data === 'number' ? data : 0
}

export async function sendSupabaseSignupConfirmation(emailAddress: string) {
  const email = normalizeEmail(emailAddress)
  if (!email) {
    throw new SupabaseAuthBridgeError(
      'MISSING_EMAIL',
      'No hay email para enviar la confirmacion.',
    )
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${getEmailAppUrl()}/auth?emailVerified=1`,
    },
  })

  if (error) {
    logger.warn('No se pudo enviar confirmacion de email', {
      error: serializeSupabaseAuthError(error),
    })
    throw new Error('AUTH_CONFIRMATION_SEND_FAILED')
  }
}

async function createAuthUserWithLegacyId(
  profile: LegacyUserForAuthBridge,
  options: CreateAuthUserOptions,
) {
  const user = await createAuthUser(profile, options, { id: profile.id })

  if (user.id !== profile.id) {
    throw new SupabaseAuthBridgeError(
      'AUTH_USER_ID_MISMATCH',
      `Supabase Auth devolvio ${user.id} pero se esperaba ${profile.id}.`,
    )
  }

  return user
}

async function createAuthUser(
  profile: Omit<LegacyUserForAuthBridge, 'id'> & { id?: string },
  options: CreateAuthUserOptions,
  overrides: { id?: string } = {},
) {
  const email = normalizeEmail(profile.email)
  if (!email) {
    throw new SupabaseAuthBridgeError(
      'MISSING_EMAIL',
      'El usuario no tiene email para crear Auth user.',
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    ...overrides,
    email,
    ...(options.password ? { password: options.password } : {}),
    email_confirm: profile.email_verified === true,
    user_metadata: {
      display_name: profile.display_name,
      first_name: profile.first_name,
      last_name: profile.last_name,
      profile_picture_url: profile.profile_picture_url,
      username: profile.username,
      legacy_email_verified: profile.email_verified ?? null,
    },
    app_metadata: {
      legacy_user_id: profile.id ?? null,
      migration_source: 'public.users',
      role: profile.platform_role ?? 'Usuario',
    },
  })

  if (error || !data.user) {
    logger.warn('Supabase Auth user creation failed', {
      error: serializeSupabaseAuthError(error),
    })
    throw new SupabaseAuthBridgeError(
      'AUTH_USER_CREATE_FAILED',
      error?.message || 'No se pudo crear usuario en Supabase Auth.',
    )
  }

  return data.user
}

function normalizeEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase()
  return normalized || null
}

function serializeSupabaseAuthError(
  error: { code?: string; message?: string; status?: number } | null,
) {
  if (!error) return null

  return {
    code: error.code ?? null,
    message: error.message ?? null,
    status: error.status ?? null,
  }
}

function isMissingAuthUserError(error: { message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? ''
  return error.status === 404 || message.includes('not found')
}
