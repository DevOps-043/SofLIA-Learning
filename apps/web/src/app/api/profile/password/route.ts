import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { SessionService } from '@/features/auth/services/session.service';
import { createClient } from '@/lib/supabase/server';
import { withZodBody } from '@/lib/api/with-validation';
import { apiError } from '@/lib/api/errors';

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

    const supabase = await createClient();
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      return apiError('USER_NOT_FOUND', 'Usuario no encontrado.', 404);
    }

    if (!userData.password_hash) {
      return apiError(
        'NO_LOCAL_PASSWORD',
        'La cuenta no tiene contrasena local configurada.',
        400,
      );
    }

    const bcrypt = await import('bcryptjs');
    const isMatch = await bcrypt.compare(body.currentPassword, userData.password_hash);
    if (!isMatch) {
      return apiError('INVALID_CURRENT_PASSWORD', 'Contrasena actual incorrecta.', 400);
    }

    const newPasswordHash = await bcrypt.hash(body.newPassword, 12);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Error actualizando contrasena:', updateError);
      return apiError('PASSWORD_UPDATE_FAILED', 'Error al cambiar contrasena.', 500);
    }

    return NextResponse.json({ success: true, message: 'Contrasena actualizada' });
  } catch (error) {
    logger.error('API /profile/password PUT Error:', error);
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500);
  }
}

export const PUT = withZodBody(passwordChangeSchema, handlePasswordChange);
