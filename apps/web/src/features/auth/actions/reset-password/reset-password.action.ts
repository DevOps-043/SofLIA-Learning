'use server';

import { z } from 'zod';
import { logger } from '../../../../lib/logger';
import { createClient } from '../../../../lib/supabase/server';
import {
  buildRateLimitError,
  checkRateLimit,
  getClientIP,
  MAX_RESET_ATTEMPTS,
  recordResetAttempt,
} from './reset-password.rate-limit';
import { parsePasswordResetPayload } from './reset-password.schemas';
import {
  changeUserPassword,
  deletePasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,
  revokeUserSessions,
} from './reset-password.db';
import { validatePasswordResetTokenState } from './reset-password.validation';

export async function resetPasswordAction(
  formData: FormData | { token: string; newPassword: string }
) {
  try {
    const clientIP = getClientIP();
    const rateLimitCheck = checkRateLimit(clientIP, MAX_RESET_ATTEMPTS);

    if (rateLimitCheck.limited) {
      return buildRateLimitError(rateLimitCheck.remainingTime);
    }

    const { newPassword, token } = parsePasswordResetPayload(formData);
    recordResetAttempt(clientIP);

    const supabase = await createClient();
    const tokenData = await getPasswordResetToken(supabase, token);
    const validation = validatePasswordResetTokenState(tokenData);

    if (!validation.valid) {
      if (tokenData && validation.error === 'Token expirado.') {
        await deletePasswordResetToken(supabase, token);
      }

      return { error: validation.error || 'Token inválido o expirado.' };
    }

    const passwordError = await changeUserPassword(supabase, tokenData!.user_id, newPassword);

    if (passwordError) {
      return { error: passwordError };
    }

    await markPasswordResetTokenUsed(supabase, token);

    try {
      await revokeUserSessions(supabase, tokenData!.user_id);
    } catch (sessionError) {
      logger.error('Error revoking sessions after password reset', sessionError);
    }

    return {
      success: true,
      message: 'Contraseña actualizada correctamente. Redirigiendo al login...',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    return { error: 'Error procesando solicitud. Inténtalo más tarde.' };
  }
}
