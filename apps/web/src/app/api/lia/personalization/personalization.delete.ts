import { NextResponse } from 'next/server'
import { SofLIAPersonalizationService } from '@/core/services/soflia-personalization.service'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'
import { createPersonalizationErrorResponse } from './personalization.errors'

export async function DELETE() {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      )
    }

    await SofLIAPersonalizationService.deleteSettings(user.id)

    return NextResponse.json({
      success: true,
      message: 'ConfiguraciÃ³n eliminada correctamente',
    })
  } catch (error: unknown) {
    logger.error('Error eliminando configuraciÃ³n de personalizaciÃ³n:', error)
    return createPersonalizationErrorResponse(
      error,
      'Error al eliminar configuraciÃ³n',
    )
  }
}
