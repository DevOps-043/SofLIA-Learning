'use server';

import { z } from 'zod';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { createAuthActionClient } from '../../../../lib/supabase/auth-server';
import { recordSecurityEvent } from '../../../../lib/security/security-events';
import { passwordSchema } from '../../../../lib/validation/password-security';
import { revokeSupabaseAuthSessions } from '../../services/supabase-auth-bridge.service';
import { validatePasswordIsNotBreached } from '../password-breach-check.server';

const nativeRecoveryPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export async function resetSupabaseRecoveryPasswordAction(
  input: FormData | { newPassword: string },
) {
  try {
    const parsed =
      input instanceof FormData
        ? nativeRecoveryPasswordSchema.parse({
            newPassword: input.get('newPassword'),
          })
        : nativeRecoveryPasswordSchema.parse(input);

    const breachError = await validatePasswordIsNotBreached(parsed.newPassword);
    if (breachError) {
      return { error: breachError };
    }

    const authClient = await createAuthActionClient();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return { error: 'Token invalido o expirado.' };
    }

    const { error: updateError } = await authClient.auth.updateUser({
      password: parsed.newPassword,
    });

    if (updateError) {
      return { error: 'Error actualizando contrasena.' };
    }

    // La contraseña vive en Supabase Auth; el hash legacy ya no existe.
    const adminSupabase = createAdminClient();
    await adminSupabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: 'Password reset',
      })
      .eq('user_id', user.id)
      .eq('is_revoked', false);
    await adminSupabase
      .from('user_session')
      .update({ revoked: true })
      .eq('user_id', user.id);
    await revokeSupabaseAuthSessions(user.id);

    recordSecurityEvent('password-reset-request', {
      actorId: user.id,
      metadata: { outcome: 'password_updated', provider: 'supabase_auth' },
    });

    await authClient.auth.signOut();

    return {
      success: true,
      message: 'Contrasena actualizada correctamente. Redirigiendo al login...',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || 'Error de validacion.' };
    }

    return { error: 'Error procesando solicitud. Intentalo mas tarde.' };
  }
}
