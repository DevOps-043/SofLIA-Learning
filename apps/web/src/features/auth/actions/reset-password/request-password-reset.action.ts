'use server';

import { z } from 'zod';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { createAuthActionClient } from '../../../../lib/supabase/auth-server';
import { requireHumanVerification } from '../../../../lib/security/bot-protection';
import { recordSecurityEvent } from '../../../../lib/security/security-events';
import { getEmailAppUrl } from '../../services/email.utils';
import { ensureSupabaseAuthUserRecordForLegacyProfile } from '../../services/supabase-auth-bridge.service';
import { parsePasswordResetRequest } from './reset-password.schemas';
import {
  buildRateLimitError,
  checkRateLimit,
  getClientIP,
  MAX_REQUEST_ATTEMPTS,
  recordResetAttempt,
} from './reset-password.rate-limit';
import {
  findPasswordResetUser,
  PASSWORD_RESET_SUCCESS_MESSAGE,
} from './request-password-reset.helpers';

const PASSWORD_RESET_ERROR_MESSAGE =
  'Error procesando solicitud. Intentalo mas tarde.';

export async function requestPasswordResetAction(
  formData: FormData | { email: string },
) {
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

    const supabase = createAdminClient();
    const user = await findPasswordResetUser(supabase, email);

    if (!user) {
      recordSecurityEvent('password-reset-request', {
        metadata: { matchedUser: false },
      });
      return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE };
    }

    try {
      await ensureSupabaseAuthUserRecordForLegacyProfile(user);
    } catch {
      return { error: PASSWORD_RESET_ERROR_MESSAGE };
    }

    const authClient = await createAuthActionClient();
    const { error: resetError } = await authClient.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${getEmailAppUrl()}/auth/reset-password?mode=supabase`,
      },
    );

    if (resetError) {
      return { error: PASSWORD_RESET_ERROR_MESSAGE };
    }

    recordSecurityEvent('password-reset-request', {
      actorId: user.id,
      metadata: { matchedUser: true, provider: 'supabase_auth' },
    });

    return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    return { error: PASSWORD_RESET_ERROR_MESSAGE };
  }
}
