import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { requireOrgAccess } from '@/lib/auth/business-auth'
import { createClient } from '@/lib/supabase/server'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/organization
 *
 * Gets organization info for the specified org slug.
 * This endpoint uses requireOrgAccess so tenant membership is enforced before
 * returning organization branding or role data.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json(
        { success: false, error: 'Organization slug is required' },
        { status: 400 },
      )
    }

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      )
    }

    const supabase = await createClient()
    const orgAccess = await requireOrgAccess({
      supabase,
      userId: currentUser.id,
      organizationSlug: orgSlug,
      isPlatformAdmin: false,
      adminFallbackRole: 'member',
      logger,
    })

    if (!orgAccess.ok) {
      return NextResponse.json(
        { success: false, error: orgAccess.error.message },
        { status: orgAccess.error.status },
      )
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, logo_url, brand_logo_url, brand_favicon_url, show_navbar_name')
      .eq('id', orgAccess.value.organizationId)
      .eq('is_active', true)
      .single()

    if (orgError || !organization) {
      logger.warn('Organization not found after access check', { orgSlug })
      return NextResponse.json(
        { success: false, error: 'Organizacion no encontrada' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo_url: organization.logo_url,
        brand_logo_url: organization.brand_logo_url,
        favicon_url: organization.brand_favicon_url,
        show_navbar_name: organization.show_navbar_name,
      },
      userRole: orgAccess.value.organizationRole,
    }, {
      headers: cacheHeaders.privateMedium,
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/organization:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
