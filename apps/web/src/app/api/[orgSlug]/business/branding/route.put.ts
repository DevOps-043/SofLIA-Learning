import { NextRequest, NextResponse } from 'next/server'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * PUT /api/[orgSlug]/business/branding
 * Actualiza la configuración de branding de la organización
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json({
        success: false,
        error: 'Slug de organización requerido'
      }, { status: 400 })
    }

    // Verificar autenticación y acceso a esta organización específica
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    // Verificar que el usuario sea owner o admin
    if (!auth.isOrgAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Solo los administradores pueden actualizar el branding'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { logo_url, favicon_url, banner_url, color_primary, color_secondary, color_accent, font_family } = body

    // Validar colores hexadecimales si se proporcionan
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

    if (color_primary && !colorRegex.test(color_primary)) {
      return NextResponse.json({
        success: false,
        error: 'El color primario debe ser un valor hexadecimal válido'
      }, { status: 400 })
    }

    if (color_secondary && !colorRegex.test(color_secondary)) {
      return NextResponse.json({
        success: false,
        error: 'El color secundario debe ser un valor hexadecimal válido'
      }, { status: 400 })
    }

    if (color_accent && !colorRegex.test(color_accent)) {
      return NextResponse.json({
        success: false,
        error: 'El color de acento debe ser un valor hexadecimal válido'
      }, { status: 400 })
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (logo_url !== undefined) updateData.brand_logo_url = logo_url || null
    if (favicon_url !== undefined) updateData.brand_favicon_url = favicon_url || null
    if (banner_url !== undefined) updateData.brand_banner_url = banner_url || null
    if (color_primary !== undefined) updateData.brand_color_primary = color_primary || DESIGN_HEX_COLOR.info
    if (color_secondary !== undefined) updateData.brand_color_secondary = color_secondary || DESIGN_HEX_COLOR.success
    if (color_accent !== undefined) updateData.brand_color_accent = color_accent || DESIGN_HEX_COLOR.secondary
    if (font_family !== undefined) updateData.brand_font_family = font_family || 'Inter'

    // Actualizar organización
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select('brand_logo_url, brand_favicon_url, brand_banner_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, logo_url')
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating branding:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar configuración de branding'
      }, { status: 500 })
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
        font_family: updatedOrg.brand_font_family || 'Inter'
      }
    })
  } catch (error) {
    logger.error('💥 Error in PUT /api/[orgSlug]/business/branding:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
