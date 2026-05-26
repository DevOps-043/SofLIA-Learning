import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export interface ProvisionedProfileInput {
  cargoRol: string
  countryCode?: string | null
  dateOfBirth?: string | null
  displayName?: string | null
  email: string
  emailVerified?: boolean
  firstName?: string | null
  gender?: string | null
  lastName?: string | null
  phone?: string | null
  profilePictureUrl?: string | null
  userId: string
  username: string
}

export async function findExistingProfileConflict(
  email: string,
  username: string,
): Promise<'email' | 'username' | null> {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('users')
    .select('username, email')
    .or(`username.eq.${username},email.eq.${email}`)

  const existing = data ?? []
  if (existing.some((user) => user.username === username)) return 'username'
  if (existing.some((user) => normalizeEmail(user.email ?? '') === email)) {
    return 'email'
  }

  return null
}

export async function upsertProvisionedProfile(input: ProvisionedProfileInput) {
  const adminSupabase = createAdminClient()
  return adminSupabase
    .from('users')
    .upsert(
      {
        cargo_rol: input.cargoRol,
        country_code: input.countryCode ?? null,
        date_of_birth: input.dateOfBirth ?? null,
        display_name: input.displayName,
        email: input.email,
        email_verified: input.emailVerified ?? true,
        first_name: input.firstName ?? null,
        gender: input.gender ?? null,
        id: input.userId,
        last_name: input.lastName ?? null,
        phone: input.phone ?? null,
        profile_picture_url: input.profilePictureUrl ?? null,
        username: input.username,
      },
      { onConflict: 'id' },
    )
    .select('id')
    .single()
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
