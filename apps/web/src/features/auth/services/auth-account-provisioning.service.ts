import 'server-only'

import { logger } from '@/lib/logger'

import { deleteSupabaseAuthUser } from './supabase-auth-bridge.service'
import {
  buildDisplayName,
  createProvisionedAuthUser,
} from './auth-account-auth-user.service'
import {
  AuthAccountProvisioningError,
  mapProvisioningError,
  serializeProvisioningCause,
} from './auth-account-provisioning-errors.service'
import {
  findExistingProfileConflict,
  upsertProvisionedProfile,
} from './auth-account-profile.service'
import type {
  ProvisionAuthAccountInput,
  ProvisionedAuthAccount,
} from './auth-account-provisioning.types'

export { AuthAccountProvisioningError, mapProvisioningError }
export type { ProvisionAuthAccountInput, ProvisionedAuthAccount }

export async function provisionAuthAccount(
  input: ProvisionAuthAccountInput,
): Promise<ProvisionedAuthAccount> {
  const email = normalizeEmail(input.email)
  const username = input.username.trim()

  const existing = await findExistingProfileConflict(email, username)
  if (existing === 'email') {
    throw new AuthAccountProvisioningError('DUPLICATE_EMAIL', 'El email ya existe')
  }
  if (existing === 'username') {
    throw new AuthAccountProvisioningError(
      'DUPLICATE_USERNAME',
      'El usuario ya existe',
    )
  }

  let userId = input.userId ?? null

  try {
    const authUser = await createProvisionedAuthUser(input, email, username)
    userId = authUser.id
  } catch (error) {
    logger.warn('Auth account provisioning failed during auth user creation', {
      error: serializeProvisioningCause(error),
    })
    throw new AuthAccountProvisioningError(
      'AUTH_CREATE_FAILED',
      error instanceof Error ? error.message : 'Error al crear usuario Auth',
    )
  }

  const { error: profileError } = await upsertProvisionedProfile({
    cargoRol: input.cargoRol,
    countryCode: input.countryCode,
    dateOfBirth: input.dateOfBirth,
    displayName: input.displayName ?? buildDisplayName(input),
    email,
    emailVerified: input.emailVerified,
    firstName: input.firstName,
    gender: input.gender,
    lastName: input.lastName,
    phone: input.phone,
    profilePictureUrl: input.profilePictureUrl,
    userId: userId as string,
    username,
  })

  if (profileError) {
    if (userId) await rollbackProvisionedAuthAccount(userId)
    logger.warn('Auth account provisioning failed during profile upsert', {
      error: serializeProvisioningCause(profileError),
      userId,
    })
    throw new AuthAccountProvisioningError(
      'PROFILE_CREATE_FAILED',
      profileError.message || 'Error al crear perfil de usuario',
    )
  }

  return { authUserId: userId as string, userId: userId as string }
}

export async function rollbackProvisionedAuthAccount(userId: string) {
  try {
    await deleteSupabaseAuthUser(userId)
  } catch (error) {
    logger.warn('No se pudo revertir usuario Auth provisionado', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    })
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
