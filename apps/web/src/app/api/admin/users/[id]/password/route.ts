import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { writeSecurityAuditLogAsync } from '@/lib/security/security-audit-log'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  ensureSupabaseAuthUserForLegacyProfile,
  revokeSupabaseAuthSessions,
} from '@/features/auth/services/supabase-auth-bridge.service'
import { validatePasswordIsNotBreached } from '@/features/auth/actions/password-breach-check.server'
import {
  AdminSetPasswordSchema,
  type AdminSetPasswordInput,
} from '@/lib/schemas/user/admin-set-password.schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

const userIdSchema = z.string().uuid()

/**
 * Set administrativo de contraseña desde el Panel Maestro del superadmin.
 * Tras el cambio se revocan TODAS las sesiones del usuario (tokens propios,
 * sesiones nativas de Supabase Auth y sesiones legacy). La contraseña jamás
 * se registra en logs ni en la auditoría (metadata solo con IDs).
 */
async function handleSetPassword(
  _request: NextRequest,
  body: AdminSetPasswordInput,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const parsedUserId = userIdSchema.safeParse(id)
    if (!parsedUserId.success) {
      return apiError('INVALID_USER_ID', 'Identificador de usuario inválido.', 400)
    }
    const targetUserId = parsedUserId.data

    const adminSupabase = createAdminClient()
    const { data: userData, error: fetchError } = await adminSupabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, first_name, last_name, display_name, profile_picture_url')
      .eq('id', targetUserId)
      .single()

    if (fetchError || !userData) {
      return apiError('USER_NOT_FOUND', 'Usuario no encontrado.', 404)
    }

    const breachError = await validatePasswordIsNotBreached(body.new_password)
    if (breachError) {
      return apiError('PASSWORD_BREACHED', breachError, 400)
    }

    try {
      await ensureSupabaseAuthUserForLegacyProfile(userData)
    } catch (authError) {
      logger.warn('No se pudo preparar usuario Auth para set de contraseña admin:', authError)
    }

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(targetUserId, {
      password: body.new_password,
    })

    if (updateError) {
      logger.error('Error en set administrativo de contraseña:', updateError)
      return apiError('PASSWORD_UPDATE_FAILED', 'Error al actualizar la contraseña.', 500)
    }

    await adminSupabase
      .from('users')
      .update({ password_hash: null, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
    await revokeSupabaseAuthSessions(targetUserId)
    await revokeAllSessionsAsAdmin(adminSupabase, targetUserId, auth.userId)
    await notifyPasswordChangedBestEffort(targetUserId)

    writeSecurityAuditLogAsync({
      action: 'admin.user.password_set',
      result: 'success',
      actorId: auth.userId,
      resourceType: 'user',
      resourceId: targetUserId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('API /admin/users/[id]/password POST Error:', error)
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500)
  }
}

export const POST = withZodBody(AdminSetPasswordSchema, handleSetPassword)

/**
 * Revoca refresh tokens propios y sesiones legacy con el cliente service-role
 * (el RefreshTokenService usa el cliente de la sesión y no aplica a terceros).
 */
async function revokeAllSessionsAsAdmin(
  adminSupabase: ReturnType<typeof createAdminClient>,
  targetUserId: string,
  actorUserId: string,
) {
  const revokedAt = new Date().toISOString()
  await Promise.all([
    adminSupabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: revokedAt,
        revoked_reason: `admin_password_set_by:${actorUserId}`,
      })
      .eq('user_id', targetUserId)
      .eq('is_revoked', false),
    adminSupabase
      .from('user_session')
      .update({ revoked: true })
      .eq('user_id', targetUserId),
  ])
}

async function notifyPasswordChangedBestEffort(userId: string) {
  try {
    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    )
    await AutoNotificationsService.notifyPasswordChanged(userId, {
      action_url: '/profile?tab=security',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.warn('No se pudo crear notificación de cambio de contraseña (admin):', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    })
  }
}
