import { createAdminClient } from '../../../../lib/supabase/admin'
import type { createAdminClient as createAdminClientType } from '../../../../lib/supabase/admin'
import type { createClient } from '../../../../lib/supabase/server'
import type { PasswordResetTokenData } from './reset-password.types'
import {
  ensureSupabaseAuthUserForLegacyProfile,
  revokeSupabaseAuthSessions,
} from '../../services/supabase-auth-bridge.service'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClientType>

export async function getPasswordResetToken(
  supabase: SupabaseServerClient,
  token: string,
): Promise<PasswordResetTokenData | null> {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('user_id, expires_at, used_at')
    .eq('token', token)
    .single()

  return error || !data ? null : data
}

export async function deletePasswordResetToken(
  supabase: SupabaseServerClient,
  token: string,
): Promise<void> {
  await supabase.from('password_reset_tokens').delete().eq('token', token)
}

export async function changeUserPassword(
  supabase: SupabaseServerClient,
  userId: string,
  newPassword: string,
): Promise<string | null> {
  const adminSupabase = createAdminClient()
  const { data: profile, error: profileError } = await adminSupabase
    .from('users')
    .select('id, username, email, email_verified, platform_role, first_name, last_name, display_name, profile_picture_url')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return 'Usuario no encontrado.'
  }

  try {
    await ensureSupabaseAuthUserForLegacyProfile(profile)
  } catch {
    return 'No se pudo preparar la cuenta de autenticacion.'
  }

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    return 'Error actualizando contrasena.'
  }

  // Supabase Auth ya guarda la nueva contraseña. Antes se anulaba aquí el hash
  // legacy de `users.password_hash`; esa columna se eliminó.
  return null
}

export async function markPasswordResetTokenUsed(
  supabase: SupabaseServerClient,
  token: string,
): Promise<void> {
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
}

export async function revokeUserSessions(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<void> {
  await supabase.from('user_session').update({ revoked: true }).eq('user_id', userId)
  await revokeSupabaseAuthSessions(userId)
}
