import 'server-only'

import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

export interface LegacyUserForAuthBridge {
  cargo_rol?: string | null
  display_name?: string | null
  email: string | null
  email_verified?: boolean | null
  first_name?: string | null
  id: string
  last_name?: string | null
  password_hash?: string | null
  profile_picture_url?: string | null
  username?: string | null
}

export interface NewAuthUserInput extends LegacyUserForAuthBridge {
  email: string
  password: string
}

export interface AuthUserRecordInput extends LegacyUserForAuthBridge {
  email: string
}

interface CreateAuthUserOptions {
  password?: string
  passwordHash?: string | null
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
      | 'MISSING_EMAIL'
      | 'MISSING_PASSWORD_HASH',
    message: string,
  ) {
    super(message)
    this.name = 'SupabaseAuthBridgeError'
  }
}

export async function ensureSupabaseAuthUserForLegacyProfile(
  profile: LegacyUserForAuthBridge,
) {
  const existingUser = await findExistingAuthUser(profile)
  if (existingUser) {
    return existingUser
  }

  if (!profile.password_hash) {
    throw new SupabaseAuthBridgeError(
      'MISSING_PASSWORD_HASH',
      'El usuario legacy no tiene password_hash migrable.',
    )
  }

  return createAuthUserWithLegacyId(profile, {
    passwordHash: profile.password_hash,
  })
}

export async function ensureSupabaseAuthUserRecordForLegacyProfile(
  profile: LegacyUserForAuthBridge,
) {
  const existingUser = await findExistingAuthUser(profile)
  if (existingUser) {
    return existingUser
  }

  return createAuthUserWithLegacyId(profile, {
    passwordHash: profile.password_hash,
  })
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

export async function createSupabaseAuthUserRecordWithLegacyId(
  input: AuthUserRecordInput,
) {
  return createAuthUserWithLegacyId(input, {})
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

async function createAuthUserWithLegacyId(
  profile: LegacyUserForAuthBridge,
  options: CreateAuthUserOptions,
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
    id: profile.id,
    email,
    ...(options.password ? { password: options.password } : {}),
    ...(options.passwordHash ? { password_hash: options.passwordHash } : {}),
    email_confirm: true,
    user_metadata: {
      display_name: profile.display_name,
      first_name: profile.first_name,
      last_name: profile.last_name,
      profile_picture_url: profile.profile_picture_url,
      username: profile.username,
      legacy_email_verified: profile.email_verified ?? null,
    },
    app_metadata: {
      legacy_user_id: profile.id,
      migration_source: 'public.users',
      role: profile.cargo_rol ?? 'Usuario',
    },
  })

  if (error || !data.user) {
    throw new SupabaseAuthBridgeError(
      'AUTH_USER_CREATE_FAILED',
      error?.message || 'No se pudo crear usuario en Supabase Auth.',
    )
  }

  if (data.user.id !== profile.id) {
    throw new SupabaseAuthBridgeError(
      'AUTH_USER_ID_MISMATCH',
      `Supabase Auth devolvio ${data.user.id} pero se esperaba ${profile.id}.`,
    )
  }

  return data.user
}

function normalizeEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase()
  return normalized || null
}

function isMissingAuthUserError(error: { message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? ''
  return error.status === 404 || message.includes('not found')
}
