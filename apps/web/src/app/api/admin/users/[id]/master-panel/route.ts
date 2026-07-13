import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { getUserMasterPanelData } from '@/features/admin/services/admin-user-master-panel/get-user-master-panel.server'

const userIdSchema = z.string().uuid()

/**
 * Estado gestionable de un usuario para el Panel Maestro del superadmin:
 * membresías de organización + asignaciones de cursos + rutas de aprendizaje.
 * Solo lectura; las mutaciones usan las rutas específicas de cada recurso.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const parsedUserId = userIdSchema.safeParse(id)
    if (!parsedUserId.success) {
      return NextResponse.json(
        { success: false, error: 'INVALID_USER_ID' },
        { status: 400 },
      )
    }

    const data = await getUserMasterPanelData(parsedUserId.data)

    return NextResponse.json(
      { success: true, ...data },
      { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } },
    )
  } catch (error) {
    logger.error('Admin user master-panel GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la información del usuario' },
      { status: 500 },
    )
  }
}
