import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { getUserForensicSummary } from '@/features/admin/services/user-forensics/user-forensics.service'

/**
 * Resumen forense completo de un usuario (super-admin): identidad, sesiones (IP/
 * dispositivo), última actividad REAL derivada de eventos, y la línea de tiempo
 * unificada. Solo lectura, protegido por requireAdmin.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: userId } = await params
    const summary = await getUserForensicSummary(userId)

    if (!summary) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(summary, {
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    })
  } catch (error) {
    logger.error('Admin user forensics GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la auditoría del usuario' },
      { status: 500 },
    )
  }
}
