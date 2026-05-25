import { NextRequest, NextResponse } from 'next/server'

import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

import {
  updateBusinessUserSchema,
  type UpdateBusinessUserBody,
} from '../schema'

type RouteContext = { params: Promise<{ userId: string }> }

async function handlePut(
  _request: NextRequest,
  body: UpdateBusinessUserBody,
  context: RouteContext,
) {
  const auth = await requireBusiness()
  if (auth instanceof NextResponse) return auth

  if (!auth.organizationId) {
    return apiError(
      'NO_ORGANIZATION',
      'No tienes una organización asignada',
      403,
    )
  }

  const { userId } = await context.params
  try {
    const updatedUser =
      await BusinessUsersServerService.updateOrganizationUser(
        auth.organizationId,
        userId,
        body,
      )
    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    logger.error('Error in /api/business/users/[userId] PUT', error)
    return apiError(
      'UPDATE_BUSINESS_USER_FAILED',
      error instanceof Error ? error.message : 'Error al actualizar usuario',
      500,
    )
  }
}

export const PUT = withZodBody(updateBusinessUserSchema, handlePut)

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireBusiness()
  if (auth instanceof NextResponse) return auth

  if (!auth.organizationId) {
    return apiError(
      'NO_ORGANIZATION',
      'No tienes una organización asignada',
      403,
    )
  }

  const { userId } = await context.params
  try {
    await BusinessUsersServerService.deleteOrganizationUser(
      auth.organizationId,
      userId,
    )
    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    })
  } catch (error) {
    logger.error('Error in /api/business/users/[userId] DELETE', error)
    return apiError(
      'DELETE_BUSINESS_USER_FAILED',
      error instanceof Error ? error.message : 'Error al eliminar usuario',
      500,
    )
  }
}
