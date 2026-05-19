import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { getThemeById, generateBrandingTheme } from '@/features/business-panel/config/preset-themes'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getBusinessAuthScope(orgSlugOrId: string) {
  return UUID_PATTERN.test(orgSlugOrId)
    ? { organizationId: orgSlugOrId }
    : { organizationSlug: orgSlugOrId }
}

/**
 * GET /api/[orgSlug]/business/styles
 * Obtiene los estilos de la organización especificada
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

    const auth = await requireBusiness(getBusinessAuthScope(orgSlug))
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    // Obtener estilos de la organización
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .eq('id', auth.organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({
        success: false,
        error: 'Error al obtener estilos'
      }, { status: 500 })
    }

    // Si hay un tema seleccionado pero no hay estilos guardados, aplicar el tema preset
    let panelStyles = organization.panel_styles
    let userDashboardStyles = organization.user_dashboard_styles
    let loginStyles = organization.login_styles

    if (organization.selected_theme && (!panelStyles || !userDashboardStyles || !loginStyles)) {
      const theme = getThemeById(organization.selected_theme)
      if (theme) {
        panelStyles = panelStyles || theme.panel
        userDashboardStyles = userDashboardStyles || theme.userDashboard
        loginStyles = loginStyles || theme.login
      }
    }

    // Obtener si el tema soporta modo dual
    let supportsDualMode = false
    if (organization.selected_theme) {
      const theme = getThemeById(organization.selected_theme)
      if (theme) {
        supportsDualMode = theme.supportsDualMode || false
      }
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: panelStyles || null,
        userDashboard: userDashboardStyles || null,
        login: loginStyles || null,
        selectedTheme: organization.selected_theme || null,
        supportsDualMode
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estilos'
    }, { status: 500 })
  }
}

/**
 * PUT /api/[orgSlug]/business/styles
 * Actualiza los estilos de la organización
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

    const auth = await requireBusiness(getBusinessAuthScope(orgSlug))
    if (auth instanceof NextResponse) return auth

    if (!auth.isOrgAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Solo los administradores pueden actualizar los estilos'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { panel, userDashboard, login } = body

    // Validar estructura de estilos
    const validateStyle = (style: Record<string, unknown>): boolean => {
      if (!style || typeof style !== 'object') return false

      const requiredFields = ['background_type', 'background_value', 'primary_button_color', 'secondary_button_color', 'accent_color']
      for (const field of requiredFields) {
        if (!style[field] || typeof style[field] !== 'string') {
          return false
        }
      }

      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (!hexColorRegex.test(style.primary_button_color as string)) return false
      if (!hexColorRegex.test(style.secondary_button_color as string)) return false
      if (!hexColorRegex.test(style.accent_color as string)) return false

      if (!['image', 'color', 'gradient'].includes(style.background_type as string)) return false

      return true
    }

    if (panel && !validateStyle(panel)) {
      return NextResponse.json({
        success: false,
        error: 'Estilos del panel inválidos'
      }, { status: 400 })
    }

    if (userDashboard && !validateStyle(userDashboard)) {
      return NextResponse.json({
        success: false,
        error: 'Estilos del dashboard de usuario inválidos'
      }, { status: 400 })
    }

    if (login && !validateStyle(login)) {
      return NextResponse.json({
        success: false,
        error: 'Estilos del login inválidos'
      }, { status: 400 })
    }

    // Construir objeto de actualización
    const updateData: Record<string, unknown> = {}
    if (panel !== undefined) updateData.panel_styles = panel
    if (userDashboard !== undefined) updateData.user_dashboard_styles = userDashboard
    if (login !== undefined) updateData.login_styles = login

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .single()

    if (updateError || !updatedOrg) {
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar estilos'
      }, { status: 500 })
    }

    let supportsDualMode = false
    if (updatedOrg.selected_theme) {
      const theme = getThemeById(updatedOrg.selected_theme)
      if (theme) {
        supportsDualMode = theme.supportsDualMode || false
      }
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: updatedOrg.panel_styles || null,
        userDashboard: updatedOrg.user_dashboard_styles || null,
        login: updatedOrg.login_styles || null,
        selectedTheme: updatedOrg.selected_theme || null,
        supportsDualMode
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar estilos'
    }, { status: 500 })
  }
}

/**
 * POST /api/[orgSlug]/business/styles
 * Aplica un tema predefinido a la organización
 */
export async function POST(
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

    const auth = await requireBusiness(getBusinessAuthScope(orgSlug))
    if (auth instanceof NextResponse) return auth

    if (!auth.isOrgAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Solo los administradores pueden aplicar temas'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { themeId } = body

    if (!themeId || typeof themeId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'ID de tema requerido'
      }, { status: 400 })
    }

    // Obtener tema predefinido o generar tema de branding
    let theme

    if (themeId === 'branding-personalizado') {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('brand_color_primary, brand_color_secondary, brand_color_accent')
        .eq('id', auth.organizationId)
        .single()

      if (orgError || !orgData) {
        return NextResponse.json({
          success: false,
          error: 'No se pudieron obtener los colores de branding'
        }, { status: 500 })
      }

      theme = generateBrandingTheme({
        color_primary: orgData.brand_color_primary || DESIGN_HEX_COLOR.info,
        color_secondary: orgData.brand_color_secondary || DESIGN_HEX_COLOR.success,
        color_accent: orgData.brand_color_accent || DESIGN_HEX_COLOR.secondary
      })
    } else {
      theme = getThemeById(themeId)
      if (!theme) {
        return NextResponse.json({
          success: false,
          error: 'Tema no encontrado'
        }, { status: 404 })
      }
    }

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({
        panel_styles: theme.panel,
        user_dashboard_styles: theme.userDashboard,
        login_styles: theme.login,
        selected_theme: themeId
      })
      .eq('id', auth.organizationId)
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .single()

    if (updateError || !updatedOrg) {
      return NextResponse.json({
        success: false,
        error: 'Error al aplicar tema'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: updatedOrg.panel_styles || null,
        userDashboard: updatedOrg.user_dashboard_styles || null,
        login: updatedOrg.login_styles || null,
        selectedTheme: updatedOrg.selected_theme || null,
        supportsDualMode: theme.supportsDualMode || false
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error al aplicar tema'
    }, { status: 500 })
  }
}
