import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import {
  createInvitationRuntime,
  resendInvitation,
} from '@/features/auth/actions/invitation/index'

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string, invitationId: string } }
) {
  try {
    const { orgSlug, invitationId } = params
    
    // Auth check
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 400 }
      )
    }

    // user_invitations perdio sus grants para `authenticated` en la migracion
    // 20260827120000_emergency_data_api_lockdown; se usa el cliente de service
    // role, ya autorizado por requireBusiness() arriba.
    const supabase = createAdminClient()

    // Obtener la invitación para verificar que pertenece a la organización
    const { data: invitation, error: fetchError } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('id', invitationId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json({ success: false, error: 'Invitación no encontrada' }, { status: 404 })
    }

    const result = await resendInvitation(
      invitationId,
      // 'admin': this route already authorized via requireBusiness() above and
      // never resolves the caller's session from the runtime, so it can use
      // the service-role client that still has grants on user_invitations.
      await createInvitationRuntime({ client: 'admin' }),
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error resending invitation:', error)
    return NextResponse.json({ success: false, error: 'Error inesperado' }, { status: 500 })
  }
}
