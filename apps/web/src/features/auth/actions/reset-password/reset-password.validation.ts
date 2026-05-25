import type { PasswordResetTokenData } from './reset-password.types';

export function validatePasswordResetTokenState(
  tokenData: PasswordResetTokenData | null
): { error?: string; valid: boolean } {
  if (!tokenData) {
    return { valid: false, error: 'Token inválido o expirado.' };
  }

  if (tokenData.used_at) {
    return { valid: false, error: 'Este enlace ya fue utilizado.' };
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return { valid: false, error: 'Token expirado.' };
  }

  return { valid: true };
}
