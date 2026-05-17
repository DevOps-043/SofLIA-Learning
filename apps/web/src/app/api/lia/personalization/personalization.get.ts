import { NextResponse } from 'next/server'
import { SofLIAPersonalizationService } from '@/core/services/soflia-personalization.service'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'
import { createPersonalizationErrorResponse } from './personalization.errors'

export async function GET() {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      )
    }

    const settings = await SofLIAPersonalizationService.getSettings(user.id)

    return NextResponse.json({
      settings,
      success: true,
    })
  } catch (error: unknown) {
    logger.error('Error obteniendo configuraciÃ³n de personalizaciÃ³n:', error)
    return createPersonalizationErrorResponse(
      error,
      'Error al obtener configuraciÃ³n',
    )
  }
}
