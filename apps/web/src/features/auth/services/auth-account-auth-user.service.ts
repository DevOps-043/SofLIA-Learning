import 'server-only'

import type { ProvisionAuthAccountInput } from './auth-account-provisioning.types'
import {
  createSupabaseAuthUser,
  createSupabaseAuthUserWithLegacyId,
} from './supabase-auth-bridge.service'

export async function createProvisionedAuthUser(
  input: ProvisionAuthAccountInput,
  normalizedEmail: string,
  username: string,
) {
  const authProfile = {
    platform_role: input.cargoRol,
    display_name: input.displayName ?? buildDisplayName(input),
    email: normalizedEmail,
    email_verified: input.emailVerified === true,
    first_name: input.firstName ?? null,
    last_name: input.lastName ?? null,
    password: input.password,
    profile_picture_url: input.profilePictureUrl ?? null,
    username,
  }

  if (input.userId) {
    return createSupabaseAuthUserWithLegacyId({
      ...authProfile,
      id: input.userId,
    })
  }

  return createSupabaseAuthUser(authProfile)
}

export function buildDisplayName(input: {
  firstName?: string | null
  lastName?: string | null
}) {
  return `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim() || null
}
