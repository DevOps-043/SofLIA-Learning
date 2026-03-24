import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { SessionService } from '../../../../features/auth/services/session.service';
import { createClient } from '../../../../lib/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Contraseñas requeridas' }, { status: 400 });
    }

    if (/\s/.test(currentPassword) || /\s/.test(newPassword)) {
      return NextResponse.json({ error: 'Las contraseñas no pueden tener espacios' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch the user's current password hash from the custom users table
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const bcrypt = await import('bcryptjs');

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userData.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password in the custom users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Error actualizando contraseña:', updateError);
      return NextResponse.json({ error: `Error al cambiar contraseña: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    logger.error('API /profile/password PUT Error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
