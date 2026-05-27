import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { SessionService } from '@/features/auth/services/session.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAuthActionClient } from '@/lib/supabase/auth-server';
import { withZodBody } from '@/lib/api/with-validation';
import { apiError } from '@/lib/api/errors';
import { ensureSupabaseAuthUserForLegacyProfile } from '@/features/auth/services/supabase-auth-bridge.service';
import { validatePasswordIsNotBreached } from '@/features/auth/actions/password-breach-check.server';

import { passwordChangeSchema, type PasswordChangeInput } from './schema';

async function handlePasswordChange(
  _request: NextRequest,
  body: PasswordChangeInput,
) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHENTICATED', 'Debes iniciar sesion para continuar.', 401);
    }

    const adminSupabase = createAdminClient();
    const { data: userData, error: fetchError } = await adminSupabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, first_name, last_name, display_name, profile_picture_url')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      return apiError('USER_NOT_FOUND', 'Usuario no encontrado.', 404);
    }

    if (!userData.email) {
      return apiError('NO_LOCAL_EMAIL', 'La cuenta no tiene email para autenticar.', 400);
    }

    const breachError = await validatePasswordIsNotBreached(body.newPassword);
    if (breachError) {
      return apiError('PASSWORD_BREACHED', breachError, 400);
    }

    try {
      await ensureSupabaseAuthUserForLegacyProfile(userData);
    } catch (authError) {
      logger.warn('No se pudo preparar usuario Auth para cambio de contrasena:', authError);
    }

    const authClient = await createAuthActionClient();
    const signInResult = await authClient.auth.signInWithPassword({
      email: userData.email,
      password: body.currentPassword,
    });

    if (signInResult.error || signInResult.data.user?.id !== user.id) {
      return apiError('INVALID_CURRENT_PASSWORD', 'Contrasena actual incorrecta.', 400);
    }

    const { error: updateError } = await authClient.auth.updateUser({
      password: body.newPassword,
    });

    if (updateError) {
      logger.error('Error actualizando contrasena:', updateError);
      return apiError('PASSWORD_UPDATE_FAILED', 'Error al cambiar contrasena.', 500);
    }

    await adminSupabase
      .from('users')
      .update({ password_hash: null })
      .eq('id', user.id);
    await revokeLegacySessionsAfterPasswordChange(adminSupabase, user.id);
    await notifyPasswordChangedBestEffort(user.id);

    return NextResponse.json({ success: true, message: 'Contrasena actualizada' });
  } catch (error) {
    logger.error('API /profile/password PUT Error:', error);
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500);
  }
}

export const PUT = withZodBody(passwordChangeSchema, handlePasswordChange);

async function notifyPasswordChangedBestEffort(userId: string) {
  try {
    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    );
    await AutoNotificationsService.notifyPasswordChanged(userId, {
      action_url: '/profile?tab=security',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn('No se pudo crear notificacion de cambio de contrasena:', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
  }
}

async function revokeLegacySessionsAfterPasswordChange(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const revokedAt = new Date().toISOString();
  await Promise.all([
    adminSupabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: revokedAt,
        revoked_reason: 'Password changed',
      })
      .eq('user_id', userId)
      .eq('is_revoked', false),
    adminSupabase
      .from('user_session')
      .update({ revoked: true })
      .eq('user_id', userId),
  ]);
}
