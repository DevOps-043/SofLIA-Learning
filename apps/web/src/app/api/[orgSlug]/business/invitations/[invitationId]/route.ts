import { NextRequest, NextResponse } from 'next/server'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; invitationId: string } },
) {
  try {
    const { orgSlug, invitationId } = params

    // Auth check
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId || !auth.isOrgAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para revocar invitaciones',
        },
        { status: 403 },
      )
    }

    const supabase = createAdminClient()

    // Revocar invitación
    const { error } = await supabase
      .from('user_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('organization_id', auth.organizationId)

    if (error) {
      logger.error('Error revoking invitation:', error)
      return NextResponse.json(
        { success: false, error: 'Error al revocar la invitación' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error revoking invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Error inesperado' },
      { status: 500 },
    )
  }
}
