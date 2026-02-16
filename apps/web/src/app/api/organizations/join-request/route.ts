import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth

  try {
    if (auth.userRole !== 'Usuario') {
      return NextResponse.json(
        { success: false, error: 'Este flujo es solo para usuarios sin organización.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { slug, message, job_title } = body

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'El código de empresa es requerido.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check user doesn't already own a pending org
    const { data: existingOwnership } = await supabase
      .from('organization_users')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('role', 'owner')

    if (existingOwnership && existingOwnership.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una empresa registrada. No puedes unirte a otra.' },
        { status: 409 }
      )
    }

    // Find organization by slug (must be active)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .ilike('slug', slug.trim())
      .eq('is_active', true)
      .maybeSingle()

    if (orgError || !organization) {
      return NextResponse.json(
        { success: false, error: 'No se encontró una empresa con ese código.' },
        { status: 404 }
      )
    }

    // Check no existing pending join request for this user+org
    const { data: existingRequest } = await supabase
      .from('organization_join_requests')
      .select('id, status')
      .eq('user_id', auth.userId)
      .eq('organization_id', organization.id)
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { success: false, error: 'Ya tienes una solicitud pendiente para esta empresa.' },
          { status: 409 }
        )
      }
      // If rejected, allow re-request by updating
      if (existingRequest.status === 'rejected') {
        const { error: updateError } = await supabase
          .from('organization_join_requests')
          .update({
            status: 'pending',
            message: message || null,
            job_title: job_title || null,
            reviewed_by: null,
            reviewed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRequest.id)

        if (updateError) {
          logger.error('Error re-submitting join request:', updateError)
          return NextResponse.json(
            { success: false, error: 'Error al reenviar la solicitud.' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Solicitud reenviada exitosamente.',
        })
      }
    }

    // Check no pending join request to any other org
    const { data: otherPending } = await supabase
      .from('organization_join_requests')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (otherPending) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una solicitud pendiente en otra empresa.' },
        { status: 409 }
      )
    }

    // Create join request
    const { error: insertError } = await supabase
      .from('organization_join_requests')
      .insert({
        user_id: auth.userId,
        organization_id: organization.id,
        status: 'pending',
        message: message || null,
        job_title: job_title || null,
      })

    if (insertError) {
      logger.error('Error creating join request:', insertError)
      return NextResponse.json(
        { success: false, error: 'Error al enviar la solicitud.' },
        { status: 500 }
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
    logger.error('Error in POST /api/organizations/join-request:', error instanceof Error ? error : undefined)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
