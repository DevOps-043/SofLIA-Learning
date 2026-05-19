import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireUser } from '@/lib/auth/requireUser'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

import { joinRequestSchema, type JoinRequestBody } from './schema'

async function handlePost(_request: NextRequest, body: JoinRequestBody) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth

  if (auth.userRole !== 'Usuario') {
    return apiError(
      'INVALID_FLOW',
      'Este flujo es solo para usuarios sin organización.',
      403,
    )
  }

  try {
    const supabase = await createClient()

    const { data: existingOwnership } = await supabase
      .from('organization_users')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('role', 'owner')

    if (existingOwnership && existingOwnership.length > 0) {
      return apiError(
        'ALREADY_OWNS_ORG',
        'Ya tienes una empresa registrada. No puedes unirte a otra.',
        409,
      )
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .ilike('slug', body.slug.trim())
      .eq('is_active', true)
      .maybeSingle()

    if (orgError || !organization) {
      return apiError(
        'ORG_NOT_FOUND',
        'No se encontró una empresa con ese código.',
        404,
      )
    }

    const { data: existingRequest } = await supabase
      .from('organization_join_requests')
      .select('id, status')
      .eq('user_id', auth.userId)
      .eq('organization_id', organization.id)
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return apiError(
          'JOIN_REQUEST_PENDING',
          'Ya tienes una solicitud pendiente para esta empresa.',
          409,
        )
      }
      if (existingRequest.status === 'rejected') {
        const { error: updateError } = await supabase
          .from('organization_join_requests')
          .update({
            status: 'pending',
            message: body.message || null,
            job_title: body.job_title || null,
            reviewed_by: null,
            reviewed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRequest.id)

        if (updateError) {
          logger.error('Error re-submitting join request:', updateError)
          return apiError(
            'JOIN_REQUEST_RESUBMIT_FAILED',
            'Error al reenviar la solicitud.',
            500,
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Solicitud reenviada exitosamente.',
        })
      }
    }

    const { data: otherPending } = await supabase
      .from('organization_join_requests')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (otherPending) {
      return apiError(
        'JOIN_REQUEST_OTHER_PENDING',
        'Ya tienes una solicitud pendiente en otra empresa.',
        409,
      )
    }

    const { error: insertError } = await supabase
      .from('organization_join_requests')
      .insert({
        user_id: auth.userId,
        organization_id: organization.id,
        status: 'pending',
        message: body.message || null,
        job_title: body.job_title || null,
      })

    if (insertError) {
      logger.error('Error creating join request:', insertError)
      return apiError(
        'JOIN_REQUEST_CREATE_FAILED',
        'Error al enviar la solicitud.',
        500,
      )
    }

    logger.info('Join request created', {
      userId: auth.userId,
      organizationId: organization.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Solicitud enviada exitosamente.',
      organizationName: organization.name,
    })
  } catch (error) {
    logger.error(
      'Error in POST /api/organizations/join-request:',
      error instanceof Error ? error : undefined,
    )
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500)
  }
}

export const POST = withZodBody(joinRequestSchema, handlePost)
