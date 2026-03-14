import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/organization
 *
 * Gets organization info for the specified org slug.
 * This endpoint ensures the user has access to the requested organization.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json(
        { success: false, error: 'Organization slug is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, logo_url, brand_logo_url, brand_favicon_url, show_navbar_name')
      .eq('slug', orgSlug)
      .eq('is_active', true)
      .single()

    if (orgError || !organization) {
      logger.warn('Organization not found:', orgSlug)
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    // Verify user belongs to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_users')
      .select('role, status')
      .eq('organization_id', organization.id)
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      logger.warn('User not member of organization:', { userId: currentUser.id, orgSlug })
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a esta organización' },
        { status: 403 }
      )
    }

    // Return organization info and user's role in this organization
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo_url: organization.logo_url,
        brand_logo_url: organization.brand_logo_url,
        favicon_url: organization.brand_favicon_url,
        show_navbar_name: organization.show_navbar_name
      },
      // El rol del usuario en esta organización (owner/admin/member)
      userRole: membership.role
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/organization:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
