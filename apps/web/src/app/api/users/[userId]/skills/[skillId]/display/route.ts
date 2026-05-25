import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import {
  updateSkillDisplaySchema,
  type UpdateSkillDisplayBody,
} from './schema'

/**
 * PATCH /api/users/[userId]/skills/[skillId]/display
 * Actualiza la visibilidad de una skill del usuario.
 */
async function handlePatch(
  _request: NextRequest,
  body: UpdateSkillDisplayBody,
  { params }: { params: Promise<{ userId: string; skillId: string }> },
) {
  try {
    const { userId, skillId } = await params
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    if (currentUser.id !== userId) {
      return apiError(
        'SKILL_DISPLAY_FORBIDDEN',
        'No autorizado para actualizar esta skill',
        403,
      )
    }

    const { is_displayed } = body
    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('user_skills')
      .update({ is_displayed })
      .eq('user_id', userId)
      .eq('skill_id', skillId)

    if (updateError) {
      logger.error('Error updating skill display:', updateError)
      return apiError(
        'SKILL_DISPLAY_UPDATE_FAILED',
        'Error al actualizar la visibilidad de la skill',
        500,
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Visibilidad de skill actualizada correctamente',
    })
  } catch (error) {
    logger.error('Error in /api/users/[userId]/skills/[skillId]/display PATCH:', error)
    return apiError('SKILL_DISPLAY_INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export const PATCH = withZodBody(updateSkillDisplaySchema, handlePatch)
