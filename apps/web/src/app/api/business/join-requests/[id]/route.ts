import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { joinRequestActionSchema, type JoinRequestActionBody } from './schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function handlePatch(
  _request: NextRequest,
  body: JoinRequestActionBody,
  { params }: RouteParams,
) {
  const auth = await requireBusiness()
  if (auth instanceof NextResponse) return auth

  try {
    if (!auth.isOrgAdmin) {
      return apiError('FORBIDDEN', 'Se requiere rol de administrador u owner.', 403)
    }

    const { id: requestId } = await params
    const { action } = body

    const supabase = await createClient()

    // Fetch the join request and verify it belongs to this org
    const { data: joinRequest, error: fetchError } = await supabase
      .from('organization_join_requests')
      .select('id, user_id, organization_id, status')
      .eq('id', requestId)
      .single()

    if (fetchError || !joinRequest) {
      return apiError('JOIN_REQUEST_NOT_FOUND', 'Solicitud no encontrada.', 404)
    }

    if (joinRequest.organization_id !== auth.organizationId) {
      return apiError(
        'FORBIDDEN',
        'No tienes permiso para gestionar esta solicitud.',
        403,
      )
    }

    if (joinRequest.status !== 'pending') {
      return apiError('JOIN_REQUEST_ALREADY_PROCESSED', 'Esta solicitud ya fue procesada.', 409)
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
      return apiError('UPDATE_JOIN_REQUEST_FAILED', 'Error al procesar la solicitud.', 500)
    }

    // If approved, add user to organization and update platform_role
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

        return apiError('ADD_ORGANIZATION_USER_FAILED', 'Error al agregar usuario a la organización.', 500)
      }

      // Update user's platform_role to 'Business'
      const { error: roleError } = await supabase
        .from('users')
        .update({ platform_role: 'Business' })
        .eq('id', joinRequest.user_id)

      if (roleError) {
        logger.error('Error updating user platform_role:', roleError)
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
    return apiError('UPDATE_JOIN_REQUEST_FAILED', 'Error interno del servidor.', 500)
  }
}

export const PATCH = withZodBody(joinRequestActionSchema, handlePatch)
