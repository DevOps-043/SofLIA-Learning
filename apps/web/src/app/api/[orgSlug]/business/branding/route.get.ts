import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/branding
 * Obtiene la configuración de branding de la organización especificada
 */
export async function GET(
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

    const supabase = await createClient()

    // Obtener branding de la organización por slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, logo_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, brand_logo_url, brand_favicon_url, brand_banner_url')
      .eq('slug', orgSlug)
      .single()

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
        color_primary: organization.brand_color_primary || '#3b82f6',
        color_secondary: organization.brand_color_secondary || '#10b981',
        color_accent: organization.brand_color_accent || '#8b5cf6',
        font_family: organization.brand_font_family || 'Inter'
      }
    })
  } catch (error) {
    logger.error('💥 Error in GET /api/[orgSlug]/business/branding:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
