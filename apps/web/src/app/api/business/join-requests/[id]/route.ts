import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireBusiness()
  if (auth instanceof NextResponse) return auth

  try {
    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        { success: false, error: 'Se requiere rol de administrador u owner.' },
        { status: 403 }
      )
    }

    const { id: requestId } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Acción inválida. Use "approve" o "reject".' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch the join request and verify it belongs to this org
    const { data: joinRequest, error: fetchError } = await supabase
      .from('organization_join_requests')
      .select('id, user_id, organization_id, status')
      .eq('id', requestId)
      .single()

    if (fetchError || !joinRequest) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada.' },
        { status: 404 }
      )
    }

    if (joinRequest.organization_id !== auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para gestionar esta solicitud.' },
        { status: 403 }
      )
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Esta solicitud ya fue procesada.' },
        { status: 409 }
      )
    }

    // Update the join request status
    const { error: updateError } = await supabase
      .from('organization_join_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateError) {
      logger.error('Error updating join request:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al procesar la solicitud.' },
        { status: 500 }
      )
    }

    // If approved, add user to organization and update cargo_rol
    if (action === 'approve') {
      // Get job_title from request
      const { data: fullRequest } = await supabase
        .from('organization_join_requests')
        .select('job_title')
        .eq('id', requestId)
        .single()

      // Add to organization_users
      const { error: memberError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: joinRequest.organization_id,
          user_id: joinRequest.user_id,
          role: 'member',
          status: 'active',
          job_title: fullRequest?.job_title || null,
          joined_at: new Date().toISOString(),
        })

      if (memberError) {
        logger.error('Error adding user to organization:', memberError)
        // Rollback the status change
        await supabase
          .from('organization_join_requests')
          .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
          .eq('id', requestId)

        return NextResponse.json(
          { success: false, error: 'Error al agregar usuario a la organización.' },
          { status: 500 }
        )
      }

      // Update user's cargo_rol to 'Business'
      const { error: roleError } = await supabase
        .from('users')
        .update({ cargo_rol: 'Business' })
        .eq('id', joinRequest.user_id)

      if (roleError) {
        logger.error('Error updating user cargo_rol:', roleError)
      }

      logger.info('Join request approved', {
        requestId,
        userId: joinRequest.user_id,
        organizationId: joinRequest.organization_id,
      })
    } else {
      logger.info('Join request rejected', {
        requestId,
        userId: joinRequest.user_id,
        organizationId: joinRequest.organization_id,
      })
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Solicitud aprobada.' : 'Solicitud rechazada.',
    })
  } catch (error) {
    logger.error('Error in PATCH /api/business/join-requests/[id]:', error instanceof Error ? error : undefined)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
