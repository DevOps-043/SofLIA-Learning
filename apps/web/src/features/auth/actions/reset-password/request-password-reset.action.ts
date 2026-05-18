'use server';

import { z } from 'zod';
import { createClient } from '../../../../lib/supabase/server';
import { requireHumanVerification } from '../../../../lib/security/bot-protection';
import { recordSecurityEvent } from '../../../../lib/security/security-events';
import { parsePasswordResetRequest } from './reset-password.schemas';
import {
  buildRateLimitError,
  checkRateLimit,
  getClientIP,
  MAX_REQUEST_ATTEMPTS,
  recordResetAttempt,
} from './reset-password.rate-limit';
import {
  createPasswordResetToken,
  findPasswordResetUser,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  sendPasswordResetEmail,
} from './request-password-reset.helpers';

export async function requestPasswordResetAction(formData: FormData | { email: string }) {
  try {
    const humanVerification = await requireHumanVerification(formData);
    if (!humanVerification.ok) {
      recordSecurityEvent('password-reset-request', {
        result: 'denied',
        metadata: { reason: 'human_verification_failed' },
      });
      return { error: humanVerification.error || 'Verificacion humana requerida' };
    }

    const clientIP = getClientIP();
    const rateLimitCheck = checkRateLimit(clientIP, MAX_REQUEST_ATTEMPTS);

    if (rateLimitCheck.limited) {
      recordSecurityEvent('rate-limit-triggered', {
        resourceType: 'password_reset',
        metadata: { remainingTime: rateLimitCheck.remainingTime },
      });
      return buildRateLimitError(rateLimitCheck.remainingTime);
    }

    const email = parsePasswordResetRequest(formData);
    recordResetAttempt(clientIP);

    const supabase = await createClient();
    const user = await findPasswordResetUser(supabase, email);

    if (!user) {
      recordSecurityEvent('password-reset-request', {
        metadata: { matchedUser: false },
      });
      return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE };
    }

    const resetToken = await createPasswordResetToken(supabase, user.id);

    if (!resetToken) {
      return { error: 'Error procesando solicitud. Inténtalo más tarde.' };
    }

    await sendPasswordResetEmail(user, resetToken);
    recordSecurityEvent('password-reset-request', {
      actorId: user.id,
      metadata: { matchedUser: true },
    });

    return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    return { error: 'Error procesando solicitud. Inténtalo más tarde.' };
  }
}
