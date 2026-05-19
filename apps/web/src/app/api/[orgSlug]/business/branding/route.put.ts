import { NextRequest, NextResponse } from 'next/server'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'
import {
  brandingUpdateSchema,
  type BrandingUpdateBody,
} from '../_schemas'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

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

    const supabase = await createClient()
    const { logo_url, favicon_url, banner_url, color_primary, color_secondary, color_accent, font_family } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (logo_url !== undefined) updateData.brand_logo_url = logo_url || null
    if (favicon_url !== undefined) updateData.brand_favicon_url = favicon_url || null
    if (banner_url !== undefined) updateData.brand_banner_url = banner_url || null
    if (color_primary !== undefined) updateData.brand_color_primary = color_primary || DESIGN_HEX_COLOR.info
    if (color_secondary !== undefined) updateData.brand_color_secondary = color_secondary || DESIGN_HEX_COLOR.success
    if (color_accent !== undefined) updateData.brand_color_accent = color_accent || DESIGN_HEX_COLOR.secondary
    if (font_family !== undefined) updateData.brand_font_family = font_family || 'Inter'

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select('brand_logo_url, brand_favicon_url, brand_banner_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, logo_url')
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
    })
  } catch (error) {
    logger.error('Error in PUT /api/[orgSlug]/business/branding:', error)
    return apiError('UPDATE_BRANDING_FAILED', 'Error interno del servidor', 500)
  }
}

export const PUT = withZodBody(brandingUpdateSchema, handlePut)
