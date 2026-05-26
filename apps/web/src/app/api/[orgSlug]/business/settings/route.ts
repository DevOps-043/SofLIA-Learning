import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import {
  organizationSettingsUpdateSchema,
  type OrganizationSettingsUpdateBody,
} from '../_schemas'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

const ORGANIZATION_SETTINGS_SELECT = `
  billing_cycle,
  brand_banner_url,
  brand_color_accent,
  brand_color_primary,
  brand_color_secondary,
  brand_favicon_url,
  brand_font_family,
  brand_logo_url,
  company_country,
  company_mission,
  company_size,
  company_type,
  contact_email,
  contact_phone,
  created_at,
  description,
  google_login_enabled,
  id,
  industry,
  is_active,
  logo_url,
  max_users,
  microsoft_login_enabled,
  name,
  show_navbar_name,
  slug,
  subscription_end_date,
  subscription_plan,
  subscription_start_date,
  subscription_status,
  updated_at,
  website_url
`

interface OrganizationSettingsRow {
  billing_cycle?: 'monthly' | 'yearly' | null
  max_users?: number | null
  subscription_end_date?: string | null
  subscription_plan?: string | null
  subscription_start_date?: string | null
  subscription_status?: string | null
}

function buildOrganizationSubscriptionSnapshot(organization: OrganizationSettingsRow) {
  const endDate = organization.subscription_end_date || null
  const endDateObj = endDate ? new Date(endDate) : null
  const now = new Date()
  const isExpired = endDateObj ? endDateObj < now : false
  const daysUntilExpiration = endDateObj
    ? Math.ceil((endDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return {
    plan: organization.subscription_plan?.toLowerCase() || 'team',
    status: organization.subscription_status || 'active',
    billing_cycle: organization.billing_cycle || 'yearly',
    start_date: organization.subscription_start_date || null,
    end_date: endDate,
    is_expired: isExpired,
    days_until_expiration: daysUntilExpiration,
    is_expiring_soon: daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0,
    max_users: organization.max_users || 10,
    user_subscriptions: [],
    active_subscription: null,
  }
}

/**
 * GET /api/[orgSlug]/business/settings
 * Obtiene los datos de la organizacion especificada por slug
 */
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json({
        success: false,
        error: 'Slug de organizacion requerido',
      }, { status: 400 })
    }

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    const { data: organization, error } = await supabase
      .from('organizations')
      .select(ORGANIZATION_SETTINGS_SELECT)
      .eq('slug', orgSlug)
      .single()

    if (error) {
      logger.error('Error fetching organization:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener datos de la organizacion',
      }, { status: 500 })
    }

    if (!organization) {
      return NextResponse.json({
        success: false,
        error: 'Organizacion no encontrada',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      organization,
      subscription: buildOrganizationSubscriptionSnapshot(organization),
      userRole: auth.organizationRole,
    })
  } catch (error) {
    logger.error('Error in GET /api/[orgSlug]/business/settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener datos de la organizacion',
    }, { status: 500 })
  }
}

/**
 * PUT /api/[orgSlug]/business/settings
 * Actualiza los datos de la organizacion especificada
 */
async function handlePut(
  _request: NextRequest,
  body: OrganizationSettingsUpdateBody,
  context: RouteContext,
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return apiError('ORG_SLUG_REQUIRED', 'Slug de organizacion requerido', 400)
    }

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.isOrgAdmin) {
      return apiError(
        'FORBIDDEN',
        'Solo los administradores pueden actualizar la organizacion',
        403,
      )
    }

    const supabase = await createClient()

    const {
      name,
      description,
      contact_email,
      contact_phone,
      website_url,
      logo_url,
      max_users,
      slug: newSlug,
      google_login_enabled,
      microsoft_login_enabled,
      show_navbar_name,
      industry,
      company_size,
      company_type,
      company_mission,
      company_country,
    } = body

    if (name !== undefined && name.trim().length === 0) {
      return apiError('ORGANIZATION_NAME_REQUIRED', 'El nombre de la organizacion es requerido', 400)
    }

    if (newSlug !== undefined && newSlug !== null && newSlug.trim() !== '') {
      const slugValue = newSlug.trim().toLowerCase()

      if (!/^[a-z0-9-]+$/.test(slugValue)) {
        return apiError(
          'INVALID_ORGANIZATION_SLUG',
          'El slug solo puede contener letras minusculas, numeros y guiones',
          400,
        )
      }

      if (slugValue.length < 3 || slugValue.length > 50) {
        return apiError(
          'INVALID_ORGANIZATION_SLUG_LENGTH',
          'El slug debe tener entre 3 y 50 caracteres',
          400,
        )
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
          'Este identificador ya esta en uso por otra organizacion',
          400,
        )
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (contact_email !== undefined) updateData.contact_email = contact_email?.trim() || null
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone?.trim() || null
    if (website_url !== undefined) updateData.website_url = website_url?.trim() || null
    if (logo_url !== undefined) updateData.logo_url = logo_url?.trim() || null
    if (newSlug !== undefined) updateData.slug = newSlug?.trim().toLowerCase() || null
    if (max_users !== undefined) {
      const maxUsersNum = parseInt(String(max_users), 10)
      if (Number.isNaN(maxUsersNum) || maxUsersNum < 1) {
        return apiError(
          'INVALID_MAX_USERS',
          'El numero maximo de usuarios debe ser mayor a 0',
          400,
        )
      }
      updateData.max_users = maxUsersNum
    }
    if (google_login_enabled !== undefined) updateData.google_login_enabled = google_login_enabled
    if (microsoft_login_enabled !== undefined) updateData.microsoft_login_enabled = microsoft_login_enabled
    if (show_navbar_name !== undefined) updateData.show_navbar_name = show_navbar_name
    if (industry !== undefined) updateData.industry = industry?.trim() || null
    if (company_size !== undefined) updateData.company_size = company_size?.trim() || null
    if (company_type !== undefined) updateData.company_type = company_type?.trim() || null
    if (company_mission !== undefined) updateData.company_mission = company_mission?.trim() || null
    if (company_country !== undefined) updateData.company_country = company_country?.trim() || null

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating organization:', updateError)
      return apiError('UPDATE_ORGANIZATION_FAILED', 'Error al actualizar la organizacion', 500)
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrganization,
    })
  } catch (error) {
    logger.error('Error in PUT /api/[orgSlug]/business/settings:', error)
    return apiError('UPDATE_ORGANIZATION_FAILED', 'Error al actualizar la organizacion', 500)
  }
}

export const PUT = withZodBody(organizationSettingsUpdateSchema, handlePut)
