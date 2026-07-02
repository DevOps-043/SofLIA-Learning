import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { buildOrganizationStylesPayload } from '@/features/business-panel/services/organization-styles-response.service'
import { applyThemeSchema, stylesUpdateSchema } from '../_schemas'

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

    const auth = await requireBusinessUser(getBusinessAuthScope(orgSlug))
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organizacion no encontrada',
      }, { status: 404 })
    }

    const supabase = await createClient()

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, branding_enabled')
      .eq('id', auth.organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({
        success: false,
        error: 'Error al obtener estilos',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      styles: buildOrganizationStylesPayload(organization),
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
  _body: unknown,
  _context: RouteContext,
) {
  return apiError(
    'STYLE_MUTATION_DISABLED',
    'Los estilos de la organizacion se administran desde Branding',
    410,
  )
}

export const PUT = withZodBody(stylesUpdateSchema, handlePut)

/**
 * POST /api/[orgSlug]/business/styles
 * Aplica un tema predefinido a la organizacion
 */
async function handlePost(
  _request: NextRequest,
  _body: unknown,
  _context: RouteContext,
) {
  return apiError(
    'STYLE_MUTATION_DISABLED',
    'Los temas manuales estan deshabilitados; Branding es la fuente visual',
    410,
  )
}

export const POST = withZodBody(applyThemeSchema, handlePost)
