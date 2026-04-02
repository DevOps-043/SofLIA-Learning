import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../../lib/logger'
import { SessionService } from '../../../../features/auth/services/session.service'
import { createClient } from '../../../../lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Contraseñas requeridas' }, { status: 400 })
    }

    if (/\s/.test(currentPassword) || /\s/.test(newPassword)) {
      return NextResponse.json({ error: 'Las contraseñas no pueden tener espacios' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single()

    if (fetchError || !userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (!userData.password_hash) {
      return NextResponse.json({ error: 'La cuenta no tiene contraseña local configurada' }, { status: 400 })
    }

    const bcrypt = await import('bcryptjs')
    const isMatch = await bcrypt.compare(currentPassword, userData.password_hash)

    if (!isMatch) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', user.id)

    if (updateError) {
      logger.error('Error actualizando contraseña:', updateError)
      return NextResponse.json({ error: 'Error al cambiar contraseña' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada' })
  } catch (error) {
    logger.error('API /profile/password PUT Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
