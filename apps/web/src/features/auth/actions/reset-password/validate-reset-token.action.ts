'use server';

import { createClient } from '../../../../lib/supabase/server';
import { getPasswordResetToken } from './reset-password.db';
import { validatePasswordResetTokenState } from './reset-password.validation';

export async function validateResetTokenAction(token: string) {
  try {
    const supabase = await createClient();
    const tokenData = await getPasswordResetToken(supabase, token);
    const validation = validatePasswordResetTokenState(tokenData);

    if (!validation.valid) {
      return { valid: false, error: validation.error || 'Token inválido.' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Error validando token.' };
  }
}
