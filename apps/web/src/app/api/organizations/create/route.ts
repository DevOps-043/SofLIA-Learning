import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireUser } from '@/lib/auth/requireUser'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

import {
  createOrganizationSchema,
  type CreateOrganizationBody,
} from './schema'

async function handlePost(
  _request: NextRequest,
  body: CreateOrganizationBody,
) {
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
      .select('id, organizations!inner(id, is_active)')
      .eq('user_id', auth.userId)
      .eq('role', 'owner')

    if (existingOwnership && existingOwnership.length > 0) {
      return apiError(
        'ALREADY_HAS_ORG',
        'Ya tienes una empresa registrada o pendiente de aprobación.',
        409,
      )
    }

    const { data: existingJoinRequest } = await supabase
      .from('organization_join_requests')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingJoinRequest) {
      return apiError(
        'HAS_PENDING_JOIN_REQUEST',
        'Ya tienes una solicitud pendiente para unirte a una empresa.',
        409,
      )
    }

    let slug = body.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingOrg) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: body.name,
        slug,
        description: body.description || null,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone || null,
        website_url: body.website_url || null,
        subscription_plan: 'team',
        subscription_status: 'pending',
        max_users: 10,
        is_active: false,
      })
      .select('id, name, slug')
      .single()

    if (orgError || !newOrg) {
      logger.error('Error creating organization:', orgError)
      return apiError('CREATE_ORG_FAILED', 'Error al crear la empresa.', 500)
    }

    const { error: memberError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: newOrg.id,
        user_id: auth.userId,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      logger.error('Error adding owner to organization:', memberError)
      await supabase.from('organizations').delete().eq('id', newOrg.id)
      return apiError(
        'ASSIGN_OWNER_FAILED',
        'Error al registrar como propietario.',
        500,
      )
    }

    logger.info('Organization created (pending approval)', {
      orgId: newOrg.id,
      userId: auth.userId,
    })

    return NextResponse.json({ success: true, organization: newOrg })
  } catch (error) {
    logger.error(
      'Error in POST /api/organizations/create:',
      error instanceof Error ? error : undefined,
    )
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500)
  }
}

export const POST = withZodBody(createOrganizationSchema, handlePost)
