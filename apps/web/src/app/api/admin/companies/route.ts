import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const companies = await AdminCompaniesService.getCompanies()
    const stats = AdminCompaniesService.calculateStats(companies)

    return NextResponse.json({
      success: true,
      companies,
      stats
    })
  } catch (error) {
    logger.error('💥 Error in GET /api/admin/companies:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener empresas',
        companies: [],
        stats: null
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const company = await AdminCompaniesService.createCompany({
      name: body.name,
      slug: body.slug,
      description: body.description,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      website_url: body.website_url,
      subscription_plan: body.subscription_plan,
      subscription_status: body.subscription_status,
      max_users: body.max_users,
      is_active: body.is_active,
      // Branding
      brand_logo_url: body.brand_logo_url,
      brand_banner_url: body.brand_banner_url,
      brand_favicon_url: body.brand_favicon_url,
      brand_color_primary: body.brand_color_primary,
      brand_color_secondary: body.brand_color_secondary,
      brand_color_accent: body.brand_color_accent,
      brand_font_family: body.brand_font_family,
      google_login_enabled: body.google_login_enabled,
      microsoft_login_enabled: body.microsoft_login_enabled,
      // Owner
      owner_email: body.owner_email,
      owner_position: body.owner_position
    })

    return NextResponse.json({
      success: true,
      company
    })
  } catch (error) {
    logger.error('💥 Error in POST /api/admin/companies:', error)
    const message = error instanceof Error ? error.message : 'Error al crear organización'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

