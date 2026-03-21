import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminCompaniesService, CompanyUpdatePayload } from '@/features/admin/services/adminCompanies.service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Obtener empresa por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId } = await params

  if (!companyId) {
    return NextResponse.json(
      { success: false, error: 'ID de empresa inválido' },
      { status: 400 }
    )
  }

  try {
    const company = await AdminCompaniesService.getCompanyById(companyId)

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      company
    })
  } catch (error) {
    logger.error(`💥 Error fetching company ${companyId}:`, error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la empresa' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar empresa
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId } = await params

  if (!companyId) {
    return NextResponse.json(
      { success: false, error: 'ID de empresa inválido' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const payload: CompanyUpdatePayload = {}

    // Campos básicos
    if (body.name !== undefined) payload.name = String(body.name)
    if (body.slug !== undefined) payload.slug = body.slug ? String(body.slug) : null
    if (body.description !== undefined) payload.description = body.description ? String(body.description) : null

    // Contacto
    if (body.contact_email !== undefined) payload.contact_email = body.contact_email ? String(body.contact_email) : null
    if (body.contact_phone !== undefined) payload.contact_phone = body.contact_phone ? String(body.contact_phone) : null
    if (body.website_url !== undefined) payload.website_url = body.website_url ? String(body.website_url) : null

    // Branding
    if (body.logo_url !== undefined) payload.logo_url = body.logo_url ? String(body.logo_url) : null
    if (body.brand_logo_url !== undefined) payload.brand_logo_url = body.brand_logo_url ? String(body.brand_logo_url) : null
    if (body.brand_banner_url !== undefined) payload.brand_banner_url = body.brand_banner_url ? String(body.brand_banner_url) : null
    if (body.brand_favicon_url !== undefined) payload.brand_favicon_url = body.brand_favicon_url ? String(body.brand_favicon_url) : null
    if (body.brand_color_primary !== undefined) payload.brand_color_primary = body.brand_color_primary ? String(body.brand_color_primary) : '#3b82f6'
    if (body.brand_color_secondary !== undefined) payload.brand_color_secondary = body.brand_color_secondary ? String(body.brand_color_secondary) : '#10b981'
    if (body.brand_color_accent !== undefined) payload.brand_color_accent = body.brand_color_accent ? String(body.brand_color_accent) : '#8b5cf6'
    if (body.brand_font_family !== undefined) payload.brand_font_family = body.brand_font_family ? String(body.brand_font_family) : 'Inter'

    // Suscripción
    if (body.is_active !== undefined) payload.is_active = Boolean(body.is_active)
    if (body.subscription_status !== undefined) payload.subscription_status = String(body.subscription_status)
    if (body.subscription_plan !== undefined) payload.subscription_plan = String(body.subscription_plan)

    // SSO
    if (body.google_login_enabled !== undefined) payload.google_login_enabled = Boolean(body.google_login_enabled)
    if (body.microsoft_login_enabled !== undefined) payload.microsoft_login_enabled = Boolean(body.microsoft_login_enabled)

    if (body.max_users !== undefined) {
      const maxUsersNumber = Number(body.max_users)
      if (!Number.isNaN(maxUsersNumber) && maxUsersNumber >= 1) {
        payload.max_users = maxUsersNumber
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se enviaron cambios' },
        { status: 400 }
      )
    }

    const company = await AdminCompaniesService.updateCompany(companyId, payload)

    return NextResponse.json({
      success: true,
      company
    })
  } catch (error) {
    logger.error(`💥 Error updating company ${companyId}:`, error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la empresa' },
      { status: 500 }
    )
  }
}

// PATCH - Actualización parcial (retrocompatibilidad)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params })
}
