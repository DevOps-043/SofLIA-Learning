import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import {
  updateBusinessUserSchema,
  type UpdateBusinessUserBody,
} from '../../_schemas'

type RouteContext = {
  params: Promise<{ orgSlug: string; userId: string }>
}

async function handlePut(
  _request: NextRequest,
  body: UpdateBusinessUserBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, userId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
    }

    const updatedUser = await BusinessUsersServerService.updateOrganizationUser(
      auth.organizationId,
      userId,
      body,
    )

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/users/[userId] PUT:', error)
    return apiError(
      'UPDATE_BUSINESS_USER_FAILED',
      error instanceof Error ? error.message : 'Error al actualizar usuario',
      500,
    )
  }
}

export const PUT = withZodBody(updateBusinessUserSchema, handlePut)

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, userId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizacion asignada' },
        { status: 403 },
      )
    }

    await BusinessUsersServerService.deleteOrganizationUser(auth.organizationId, userId)

    return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/users/[userId] DELETE:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar usuario' },
      { status: 500 },
    )
  }
}
