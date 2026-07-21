import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { getLiaTranscript } from '@/features/admin/services/user-forensics/user-forensics.lia'

/**
 * Transcripción del chat con LIA de una conversación (mensajes del alumno y de LIA).
 * Acotada por el userId de la ruta. Super-admin, solo lectura.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; conversationId: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: userId, conversationId } = await params
    const transcript = await getLiaTranscript(userId, conversationId)

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'Conversación no encontrada para este usuario' },
        { status: 404 },
      )
    }

    return NextResponse.json(transcript, {
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    })
  } catch (error) {
    logger.error('Admin user forensics LIA transcript GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la conversación con LIA' },
      { status: 500 },
    )
  }
}
