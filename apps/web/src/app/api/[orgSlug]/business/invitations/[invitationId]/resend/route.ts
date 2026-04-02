import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { resendInvitationAction } from '@/features/auth/actions/invitation'

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

    const supabase = await createClient()
    
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

    // Usar la acción existente para reenviar
    const result = await resendInvitationAction(invitationId)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error resending invitation:', error)
    return NextResponse.json({ success: false, error: 'Error inesperado' }, { status: 500 })
  }
}
