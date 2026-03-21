import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; userId: string }> }
) {
  try {
    const { orgSlug, userId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const updatedUser = await BusinessUsersServerService.updateOrganizationUser(
      auth.organizationId,
      userId,
      body
    )

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/users/[userId] PUT:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; userId: string }> }
) {
  try {
    const { orgSlug, userId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    await BusinessUsersServerService.deleteOrganizationUser(auth.organizationId, userId)

    return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/users/[userId] DELETE:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
