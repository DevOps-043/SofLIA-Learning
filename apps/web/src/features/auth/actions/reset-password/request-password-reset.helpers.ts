import { logger } from '../../../../lib/logger';
import { escapeIlikePattern } from '../../../../lib/supabase/ilike-escape';
import type { createAdminClient } from '../../../../lib/supabase/admin';
import type { createClient } from '../../../../lib/supabase/server';
import type { PasswordResetUser } from './reset-password.types';

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'Si el correo está registrado, recibirás un enlace de recuperación.';

type PasswordResetLookupClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

export async function findPasswordResetUser(
  supabase: PasswordResetLookupClient,
  email: string
): Promise<PasswordResetUser | null> {
  const normalized = email.trim();
  if (!normalized) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, first_name, last_name, display_name, profile_picture_url, platform_role, email_verified')
    .ilike('email', escapeIlikePattern(normalized))
    .maybeSingle();

  if (error) {
    logger.error('DB error during password reset lookup', {
      code: error.code,
      message: error.message,
    });
    return null;
  }

  if (!user) {
    logger.info('No user matched password reset email');
    return null;
  }

  logger.info('User found for password reset', { userId: user.id });
  return user;
}
