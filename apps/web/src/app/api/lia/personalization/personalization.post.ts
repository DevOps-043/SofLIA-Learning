import { NextRequest, NextResponse } from 'next/server'
import { SofLIAPersonalizationService } from '@/core/services/soflia-personalization.service'
import type { SofLIAPersonalizationSettingsInput } from '@/core/types/soflia-personalization.types'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'
import {
  createPersonalizationErrorResponse,
  getErrorMessage,
} from './personalization.errors'
import {
  buildPersonalizationSettingsInput,
  hasPersonalizationUpdateField,
  sanitizeCustomInstructions,
} from './personalization.input'

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json() as Partial<SofLIAPersonalizationSettingsInput>
    const settingsInput = buildPersonalizationSettingsInput(body)

    if (!hasPersonalizationUpdateField(settingsInput)) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un campo para actualizar' },
        { status: 400 },
      )
    }

    const sanitizedInput = sanitizeCustomInstructions(settingsInput, user.id)
    const updatedSettings = await SofLIAPersonalizationService.updateSettings(
      user.id,
      sanitizedInput,
    )

    return NextResponse.json({
      settings: updatedSettings,
      success: true,
      message: 'ConfiguraciÃ³n actualizada correctamente',
    })
  } catch (error: unknown) {
    logger.error('Error actualizando configuraciÃ³n de personalizaciÃ³n:', error)

    if (getErrorMessage(error).includes('exceder')) {
      return NextResponse.json(
        {
          error: getErrorMessage(error),
          success: false,
        },
        { status: 400 },
      )
    }

    return createPersonalizationErrorResponse(
      error,
      'Error al actualizar configuraciÃ³n',
    )
  }
}
