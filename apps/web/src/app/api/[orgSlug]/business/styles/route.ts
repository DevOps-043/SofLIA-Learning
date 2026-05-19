import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { getThemeById, generateBrandingTheme } from '@/features/business-panel/config/preset-themes'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import {
  applyThemeSchema,
  stylesUpdateSchema,
  type ApplyThemeBody,
  type StylesUpdateBody,
} from '../_schemas'

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
 * Obtiene los estilos de la organizacion especificada
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

    const auth = await requireBusiness(getBusinessAuthScope(orgSlug))
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .eq('id', auth.organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({
        success: false,
        error: 'Error al obtener estilos',
      }, { status: 500 })
    }

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
        supportsDualMode,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estilos',
    }, { status: 500 })
  }
}

/**
 * PUT /api/[orgSlug]/business/styles
 * Actualiza los estilos de la organizacion
 */
async function handlePut(
  _request: NextRequest,
  body: StylesUpdateBody,
  context: RouteContext,
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return apiError('ORG_SLUG_REQUIRED', 'Slug de organizacion requerido', 400)
    }

    const auth = await requireBusiness(getBusinessAuthScope(orgSlug))
    if (auth instanceof NextResponse) return auth

    if (!auth.isOrgAdmin) {
      return apiError(
        'FORBIDDEN',
        'Solo los administradores pueden actualizar los estilos',
        403,
      )
    }

    const supabase = await createClient()
    const { panel, userDashboard, login } = body

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
      return apiError('UPDATE_STYLES_FAILED', 'Error al actualizar estilos', 500)
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
        supportsDualMode,
      },
    })
  } catch (error) {
    return apiError('UPDATE_STYLES_FAILED', 'Error al actualizar estilos', 500)
  }
}

export const PUT = withZodBody(stylesUpdateSchema, handlePut)

/**
 * POST /api/[orgSlug]/business/styles
 * Aplica un tema predefinido a la organizacion
 */
async function handlePost(
  _request: NextRequest,
  body: ApplyThemeBody,
  context: RouteContext,
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return apiError('ORG_SLUG_REQUIRED', 'Slug de organizacion requerido', 400)
    }

    const auth = await requireBusiness(getBusinessAuthScope(orgSlug))
    if (auth instanceof NextResponse) return auth

    if (!auth.isOrgAdmin) {
      return apiError(
        'FORBIDDEN',
        'Solo los administradores pueden aplicar temas',
        403,
      )
    }

    const supabase = await createClient()
    const { themeId } = body
    let theme

    if (themeId === 'branding-personalizado') {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('brand_color_primary, brand_color_secondary, brand_color_accent')
        .eq('id', auth.organizationId)
        .single()

      if (orgError || !orgData) {
        return apiError(
          'BRANDING_COLORS_NOT_FOUND',
          'No se pudieron obtener los colores de branding',
          500,
        )
      }

      theme = generateBrandingTheme({
        color_primary: orgData.brand_color_primary || DESIGN_HEX_COLOR.info,
        color_secondary: orgData.brand_color_secondary || DESIGN_HEX_COLOR.success,
        color_accent: orgData.brand_color_accent || DESIGN_HEX_COLOR.secondary,
      })
    } else {
      theme = getThemeById(themeId)
      if (!theme) {
        return apiError('THEME_NOT_FOUND', 'Tema no encontrado', 404)
      }
    }

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({
        panel_styles: theme.panel,
        user_dashboard_styles: theme.userDashboard,
        login_styles: theme.login,
        selected_theme: themeId,
      })
      .eq('id', auth.organizationId)
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .single()

    if (updateError || !updatedOrg) {
      return apiError('APPLY_THEME_FAILED', 'Error al aplicar tema', 500)
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: updatedOrg.panel_styles || null,
        userDashboard: updatedOrg.user_dashboard_styles || null,
        login: updatedOrg.login_styles || null,
        selectedTheme: updatedOrg.selected_theme || null,
        supportsDualMode: theme.supportsDualMode || false,
      },
    })
  } catch (error) {
    return apiError('APPLY_THEME_FAILED', 'Error al aplicar tema', 500)
  }
}

export const POST = withZodBody(applyThemeSchema, handlePost)
