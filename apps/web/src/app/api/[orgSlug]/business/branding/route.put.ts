import { NextRequest, NextResponse } from 'next/server'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import {
  BRANDING_THEME_ID,
  generateOrganizationBrandingTheme,
  normalizeOrganizationBrandingColors,
} from '@/core/theme/organization-branding-theme'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/supabase/types'

import { logger } from '@/lib/utils/logger'
import { buildOrganizationStylesPayload } from '@/features/business-panel/services/organization-styles-response.service'
import {
  brandingUpdateSchema,
  type BrandingUpdateBody,
} from '../_schemas'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

interface OrganizationBrandingSource {
  brand_color_primary?: string | null
  brand_color_secondary?: string | null
  brand_color_accent?: string | null
  brand_font_family?: string | null
}

type OrganizationUpdateData = Database['public']['Tables']['organizations']['Update']

/**
 * PUT /api/[orgSlug]/business/branding
 * Actualiza la configuracion de branding de la organizacion
 */
async function handlePut(
  _request: NextRequest,
  body: BrandingUpdateBody,
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
        'Solo los administradores pueden actualizar el branding',
        403,
      )
    }

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'Organizacion no encontrada', 404)
    }

    const supabase = await createClient()
    const { logo_url, favicon_url, banner_url, color_primary, color_secondary, color_accent, font_family } = body

    const { data: currentBranding, error: currentBrandingError } = await supabase
      .from('organizations')
      .select('brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family')
      .eq('id', auth.organizationId)
      .single()

    if (currentBrandingError || !currentBranding) {
      logger.error('Error fetching current branding before update:', currentBrandingError)
      return apiError(
        'BRANDING_NOT_FOUND',
        'No se pudo obtener el branding actual de la organizacion',
        500,
      )
    }

    const nextBranding = normalizeOrganizationBrandingColors({
      brand_color_primary: color_primary !== undefined
        ? color_primary
        : (currentBranding as OrganizationBrandingSource).brand_color_primary,
      brand_color_secondary: color_secondary !== undefined
        ? color_secondary
        : (currentBranding as OrganizationBrandingSource).brand_color_secondary,
      brand_color_accent: color_accent !== undefined
        ? color_accent
        : (currentBranding as OrganizationBrandingSource).brand_color_accent,
      brand_font_family: font_family !== undefined
        ? font_family
        : (currentBranding as OrganizationBrandingSource).brand_font_family,
    })
    const brandingTheme = generateOrganizationBrandingTheme(nextBranding)

    const updateData: OrganizationUpdateData = {
      updated_at: new Date().toISOString(),
      brand_color_primary: nextBranding.color_primary,
      brand_color_secondary: nextBranding.color_secondary,
      brand_color_accent: nextBranding.color_accent,
      brand_font_family: nextBranding.font_family,
      panel_styles: brandingTheme.panel as unknown as Json,
      user_dashboard_styles: brandingTheme.userDashboard as unknown as Json,
      login_styles: brandingTheme.login as unknown as Json,
      selected_theme: BRANDING_THEME_ID,
    }

    if (logo_url !== undefined) updateData.brand_logo_url = logo_url || null
    if (favicon_url !== undefined) updateData.brand_favicon_url = favicon_url || null
    if (banner_url !== undefined) updateData.brand_banner_url = banner_url || null

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select('brand_logo_url, brand_favicon_url, brand_banner_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, logo_url, panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating branding:', updateError)
      return apiError(
        'UPDATE_BRANDING_FAILED',
        'Error al actualizar configuracion de branding',
        500,
      )
    }

    return NextResponse.json({
      success: true,
      branding: {
        logo_url: updatedOrg.brand_logo_url || updatedOrg.logo_url || null,
        favicon_url: updatedOrg.brand_favicon_url || null,
        banner_url: updatedOrg.brand_banner_url || null,
        color_primary: updatedOrg.brand_color_primary || DESIGN_HEX_COLOR.info,
        color_secondary: updatedOrg.brand_color_secondary || DESIGN_HEX_COLOR.success,
        color_accent: updatedOrg.brand_color_accent || DESIGN_HEX_COLOR.secondary,
        font_family: updatedOrg.brand_font_family || 'Inter',
      },
      styles: buildOrganizationStylesPayload(updatedOrg),
    })
  } catch (error) {
    logger.error('Error in PUT /api/[orgSlug]/business/branding:', error)
    return apiError('UPDATE_BRANDING_FAILED', 'Error interno del servidor', 500)
  }
}

export const PUT = withZodBody(brandingUpdateSchema, handlePut)
