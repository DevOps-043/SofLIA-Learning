import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'

interface OrganizationBrandingRow {
  id?: string
  name?: string
  logo_url?: string | null
  brand_logo_url?: string | null
  brand_favicon_url?: string | null
  brand_banner_url?: string | null
  brand_color_primary?: string | null
  brand_color_secondary?: string | null
  brand_color_accent?: string | null
  brand_font_family?: string | null
}

interface BrandingUpdateData {
  updated_at: string
  brand_logo_url?: string | null
  brand_favicon_url?: string | null
  brand_banner_url?: string | null
  brand_color_primary?: string
  brand_color_secondary?: string
  brand_color_accent?: string
  brand_font_family?: string
}

/**
 * GET /api/business/settings/branding
 * Obtiene la configuración de branding de la organización
 */
export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Intentar obtener brand_banner_url si existe, si no, usar null
    let organization: OrganizationBrandingRow | null = null
    let orgError: Error | { message?: string } | null = null

    // Primero intentar con brand_banner_url
    const { data: orgWithBanner, error: errorWithBanner } = await supabase
      .from('organizations')
      .select('id, name, logo_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, brand_logo_url, brand_favicon_url, brand_banner_url')
      .eq('id', auth.organizationId)
      .single()

    if (errorWithBanner && errorWithBanner.message?.includes('brand_banner_url')) {
      // Si el campo no existe, intentar sin él
      const { data: orgWithoutBanner, error: errorWithoutBanner } = await supabase
        .from('organizations')
        .select('id, name, logo_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, brand_logo_url, brand_favicon_url')
        .eq('id', auth.organizationId)
        .single()
      
      organization = orgWithoutBanner
      orgError = errorWithoutBanner
      // Agregar brand_banner_url como null si no existe
      if (organization) {
        organization.brand_banner_url = null
      }
    } else {
      organization = orgWithBanner
      orgError = errorWithBanner
    }

    if (orgError || !organization) {
      logger.error('Error fetching organization branding:', orgError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener configuración de branding'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      branding: {
        logo_url: organization.brand_logo_url || organization.logo_url || null,
        favicon_url: organization.brand_favicon_url || null,
        banner_url: organization.brand_banner_url || null,
        color_primary: organization.brand_color_primary || DESIGN_HEX_COLOR.info,
        color_secondary: organization.brand_color_secondary || DESIGN_HEX_COLOR.success,
        color_accent: organization.brand_color_accent || DESIGN_HEX_COLOR.secondary,
        font_family: organization.brand_font_family || 'Inter'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/settings/branding GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * PUT /api/business/settings/branding
 * Actualiza la configuración de branding de la organización
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
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

    // Validar fuente (permitir fuentes comunes de Google Fonts o web-safe)
    const validFonts = ['Inter', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Source Sans Pro', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia']
    if (font_family && !validFonts.includes(font_family) && !font_family.match(/^[a-zA-Z\s]+$/)) {
      return NextResponse.json({
        success: false,
        error: 'La fuente debe ser una fuente válida'
      }, { status: 400 })
    }

    // Preparar datos de actualización
    const updateData: BrandingUpdateData = {
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
    let updatedOrg: OrganizationBrandingRow | null = null
    let updateError: Error | { message?: string } | null = null

    // Intentar actualizar con brand_banner_url primero
    const { data: updatedWithBanner, error: errorWithBanner } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select('brand_logo_url, brand_favicon_url, brand_banner_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, logo_url')
      .single()

    if (errorWithBanner && errorWithBanner.message?.includes('brand_banner_url')) {
      // Si el campo no existe, actualizar sin él
      const updateDataWithoutBanner = { ...updateData }
      delete updateDataWithoutBanner.brand_banner_url
      
      const { data: updatedWithoutBanner, error: errorWithoutBanner } = await supabase
        .from('organizations')
        .update(updateDataWithoutBanner)
        .eq('id', auth.organizationId)
        .select('brand_logo_url, brand_favicon_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, logo_url')
        .single()
      
      updatedOrg = updatedWithoutBanner
      updateError = errorWithoutBanner
      // Agregar brand_banner_url como null si no existe en la BD
      if (updatedOrg) {
        updatedOrg.brand_banner_url = null
      }
    } else {
      updatedOrg = updatedWithBanner
      updateError = errorWithBanner
    }

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
    logger.error('💥 Error in /api/business/settings/branding PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
