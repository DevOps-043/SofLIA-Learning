import crypto from 'crypto';
import { emailService } from '../../services/email.service';
import { logger } from '../../../../lib/logger';
import { escapeIlikePattern } from '../../../../lib/supabase/ilike-escape';
import type { PasswordResetUser } from './reset-password.types';

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'Si el correo está registrado, recibirás un enlace de recuperación.';

export async function findPasswordResetUser(
  supabase: Awaited<ReturnType<typeof import('../../../../lib/supabase/server').createClient>>,
  email: string
): Promise<PasswordResetUser | null> {
  const normalized = email.trim();
  if (!normalized) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, first_name')
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

export async function createPasswordResetToken(
  supabase: Awaited<ReturnType<typeof import('../../../../lib/supabase/server').createClient>>,
  userId: string
): Promise<string | null> {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000);
  const { error } = await supabase.from('password_reset_tokens').insert({
    expires_at: expiresAt.toISOString(),
    token: resetToken,
    user_id: userId,
  });

  if (error) {
    logger.error('Error inserting reset token', error);
    return null;
  }

  return resetToken;
}

export async function sendPasswordResetEmail(
  user: PasswordResetUser,
  resetToken: string
): Promise<void> {
  try {
    if (!emailService.isReady()) {
      logger.error('Email service not ready for password reset');
      return;
    }

    const userEmail = user.email?.trim();
    if (!userEmail) {
      logger.error('User found without email, skipping reset email', { userId: user.id });
      return;
    }

    const username = user.first_name || user.username || userEmail.split('@')[0];
    await emailService.sendPasswordResetEmail(userEmail, resetToken, username);
  } catch (emailError) {
    logger.error('Error sending password reset email', emailError);
  }
}
