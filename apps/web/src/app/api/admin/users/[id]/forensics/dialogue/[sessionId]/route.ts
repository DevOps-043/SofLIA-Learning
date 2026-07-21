import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { getDialogueTranscript } from '@/features/admin/services/user-forensics/user-forensics.dialogue'

/**
 * Transcripción forense de una sesión de diálogo SofLIA (turnos + evaluaciones +
 * resultado). Acotada por el userId de la ruta. Super-admin, solo lectura.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: userId, sessionId } = await params
    const transcript = await getDialogueTranscript(userId, sessionId)

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'Sesión de diálogo no encontrada para este usuario' },
        { status: 404 },
      )
    }

    return NextResponse.json(transcript, {
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    })
  } catch (error) {
    logger.error('Admin user forensics dialogue GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la transcripción del diálogo' },
      { status: 500 },
    )
  }
}
