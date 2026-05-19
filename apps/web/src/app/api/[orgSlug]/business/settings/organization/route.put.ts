import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'
import {
  organizationProfileUpdateSchema,
  type OrganizationProfileUpdateBody,
} from '../../_schemas'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

/**
 * PUT /api/[orgSlug]/business/settings/organization
 * Actualiza los datos de la organizacion activa
 */
async function handlePut(
  _request: NextRequest,
  body: OrganizationProfileUpdateBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
    }

    const supabase = await createClient()

    const { data: orgUser, error: orgUserError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', auth.organizationId)
      .eq('user_id', auth.userId)
      .single()

    if (orgUserError || !orgUser) {
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para actualizar la organizacion',
        403,
      )
    }

    if (orgUser.role !== 'owner' && orgUser.role !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo los administradores pueden actualizar la organizacion',
        403,
      )
    }

    const {
      name,
      description,
      contact_email,
      contact_phone,
      website_url,
      logo_url,
      max_users,
      slug: newSlug,
    } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      if (name.trim().length === 0) {
        return apiError('ORGANIZATION_NAME_REQUIRED', 'El nombre es requerido', 400)
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) updateData.description = description?.trim() || null
    if (contact_email !== undefined) updateData.contact_email = contact_email?.trim() || null
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone?.trim() || null
    if (website_url !== undefined) updateData.website_url = website_url?.trim() || null
    if (logo_url !== undefined) updateData.logo_url = logo_url?.trim() || null

    if (newSlug !== undefined && newSlug !== null && newSlug.trim() !== '' && newSlug !== orgSlug) {
      const slugValue = newSlug.trim().toLowerCase()

      if (!/^[a-z0-9-]+$/.test(slugValue)) {
        return apiError('INVALID_ORGANIZATION_SLUG', 'Formato de slug invalido', 400)
      }

      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .ilike('slug', slugValue)
        .neq('id', auth.organizationId)
        .single()

      if (existingOrg) {
        return apiError(
          'ORGANIZATION_SLUG_TAKEN',
          'Este identificador ya esta en uso',
          400,
        )
      }
      updateData.slug = slugValue
    }

    if (max_users !== undefined) {
      const maxUsersNum = parseInt(String(max_users), 10)
      if (Number.isNaN(maxUsersNum) || maxUsersNum < 1) {
        return apiError('INVALID_MAX_USERS', 'Numero de usuarios invalido', 400)
      }
      updateData.max_users = maxUsersNum
    }

    if (body.google_login_enabled !== undefined) updateData.google_login_enabled = body.google_login_enabled
    if (body.microsoft_login_enabled !== undefined) updateData.microsoft_login_enabled = body.microsoft_login_enabled

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating organization:', updateError)
      return apiError('UPDATE_ORGANIZATION_FAILED', 'Error al actualizar', 500)
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrganization,
    })
  } catch (error) {
    logger.error('Error in PUT /api/[orgSlug]/business/settings/organization:', error)
    return apiError('UPDATE_ORGANIZATION_FAILED', 'Error interno', 500)
  }
}

export const PUT = withZodBody(organizationProfileUpdateSchema, handlePut)
