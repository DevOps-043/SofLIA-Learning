import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'

import type { LoginSupabaseClient, LoginUserRecord } from './types'

export async function findLoginUser(
  supabase: LoginSupabaseClient,
  emailOrUsername: string
): Promise<LoginUserRecord | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, password_hash, email_verified, cargo_rol, is_banned, ban_reason')
    .or(`username.ilike.${emailOrUsername},email.ilike.${emailOrUsername}`)
    .maybeSingle<LoginUserRecord>()

  return error || !user ? null : user
}

export async function validateLoginPassword(
  user: LoginUserRecord,
  password: string
) {
  if (user.is_banned) {
    return {
      banned: true,
      error: `Tu cuenta ha sido suspendida por violaciones de las reglas de la comunidad. ${user.ban_reason || ''}`,
    }
  }

  if (!user.password_hash) {
    return {
      error: 'Error en la configuracion de la cuenta. Por favor, contacta al soporte.',
    }
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash)
  if (passwordValid) {
    return null
  }

  await notifyFailedLogin(user.id)
  return { error: 'Credenciales invalidas' }
}

async function notifyFailedLogin(userId: string): Promise<void> {
  try {
    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    )
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await AutoNotificationsService.notifyLoginFailed(userId, ip, userAgent, {
      timestamp: new Date().toISOString(),
    })
  } catch {
    // Login feedback must not expose notification failures.
  }
}
