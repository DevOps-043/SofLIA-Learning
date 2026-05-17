'use server';

import { z } from 'zod';
import { createClient } from '../../../../lib/supabase/server';
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
    const clientIP = getClientIP();
    const rateLimitCheck = checkRateLimit(clientIP, MAX_REQUEST_ATTEMPTS);

    if (rateLimitCheck.limited) {
      return buildRateLimitError(rateLimitCheck.remainingTime);
    }

    const email = parsePasswordResetRequest(formData);
    recordResetAttempt(clientIP);

    const supabase = await createClient();
    const user = await findPasswordResetUser(supabase, email);

    if (!user) {
      return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE };
    }

    const resetToken = await createPasswordResetToken(supabase, user.id);

    if (!resetToken) {
      return { error: 'Error procesando solicitud. Inténtalo más tarde.' };
    }

    await sendPasswordResetEmail(user, resetToken);

    return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    return { error: 'Error procesando solicitud. Inténtalo más tarde.' };
  }
}
