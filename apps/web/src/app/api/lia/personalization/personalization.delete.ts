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
      message: 'Configuración eliminada correctamente',
    })
  } catch (error: unknown) {
    logger.error('Error eliminando configuración de personalización:', error)
    return createPersonalizationErrorResponse(
      error,
      'Error al eliminar configuración',
    )
  }
}
