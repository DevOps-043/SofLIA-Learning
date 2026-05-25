import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'

import { logger } from '@/lib/logger'
import { escapeIlikePattern } from '@/lib/supabase/ilike-escape'

import type { LoginSupabaseClient, LoginUserRecord } from './types'

const LOGIN_USER_COLUMNS =
  'id, username, email, password_hash, email_verified, cargo_rol, is_banned, ban_reason, first_name, last_name, display_name, profile_picture_url'

export async function findLoginUser(
  supabase: LoginSupabaseClient,
  emailOrUsername: string
): Promise<LoginUserRecord | null> {
  const normalized = emailOrUsername.trim()
  if (!normalized) {
    return null
  }

  const pattern = escapeIlikePattern(normalized)

  const [byUsername, byEmail] = await Promise.all([
    supabase
      .from('users')
      .select(LOGIN_USER_COLUMNS)
      .ilike('username', pattern)
      .maybeSingle<LoginUserRecord>(),
    supabase
      .from('users')
      .select(LOGIN_USER_COLUMNS)
      .ilike('email', pattern)
      .maybeSingle<LoginUserRecord>(),
  ])

  if (byUsername.error) {
    logger.error('Login lookup by username failed', {
      code: byUsername.error.code,
      message: byUsername.error.message,
    })
  }
  if (byEmail.error) {
    logger.error('Login lookup by email failed', {
      code: byEmail.error.code,
      message: byEmail.error.message,
    })
  }

  return byUsername.data ?? byEmail.data ?? null
}

export async function findLoginUserById(
  supabase: LoginSupabaseClient,
  userId: string
): Promise<LoginUserRecord | null> {
  const { data, error } = await supabase
    .from('users')
    .select(LOGIN_USER_COLUMNS)
    .eq('id', userId)
    .maybeSingle<LoginUserRecord>()

  if (error) {
    logger.error('Login lookup by id failed', {
      code: error.code,
      message: error.message,
    })
  }

  return data ?? null
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
