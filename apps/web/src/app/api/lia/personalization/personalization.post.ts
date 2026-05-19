import { NextRequest, NextResponse } from 'next/server'
import { SofLIAPersonalizationService } from '@/core/services/soflia-personalization.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'
import { getErrorMessage } from './personalization.errors'
import {
  buildPersonalizationSettingsInput,
  hasPersonalizationUpdateField,
  sanitizeCustomInstructions,
} from './personalization.input'
import {
  personalizationUpdateSchema,
  type PersonalizationUpdateBody,
} from '../_schemas'

async function handlePost(
  _request: NextRequest,
  body: PersonalizationUpdateBody,
  _context: unknown,
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const settingsInput = buildPersonalizationSettingsInput(body)

    if (!hasPersonalizationUpdateField(settingsInput)) {
      return apiError(
        'PERSONALIZATION_EMPTY_UPDATE',
        'Debe proporcionar al menos un campo para actualizar',
        400,
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
      message: 'Configuracion actualizada correctamente',
    })
  } catch (error: unknown) {
    logger.error('Error actualizando configuracion de personalizacion:', error)

    if (getErrorMessage(error).includes('exceder')) {
      return apiError(
        'PERSONALIZATION_VALIDATION_ERROR',
        getErrorMessage(error),
        400,
      )
    }

    return apiError(
      'PERSONALIZATION_UPDATE_FAILED',
      'Error al actualizar configuracion',
      500,
    )
  }
}

export const POST = withZodBody(personalizationUpdateSchema, handlePost)
