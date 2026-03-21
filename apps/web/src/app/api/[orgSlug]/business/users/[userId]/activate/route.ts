import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'

export async function POST(
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

    await BusinessUsersServerService.activateUser(auth.organizationId, userId)

    return NextResponse.json({ success: true, message: 'Usuario activado exitosamente' })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/users/[userId]/activate:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al activar usuario' },
      { status: 500 }
    )
  }
}
