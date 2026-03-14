import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consumeBulkInvitationAction } from '@/features/auth/actions/invitation'

// GET - Validate an invite token (public endpoint)
// ... (rest of the GEThandler remains the same)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || token.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Token inválido', valid: false },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the invite link and organization details
    const { data: link, error } = await supabase
      .from('bulk_invite_links')
      .select(`
        id,
        token,
        name,
        max_uses,
        current_uses,
        role,
        expires_at,
        status,
        organization_id,
        organizations (
          id,
          name,
          slug,
          logo_url,
          brand_logo_url,
          brand_favicon_url,
          brand_color_primary,
          brand_color_accent
        )
      `)
      .eq('token', token)
      .single()

    if (error || !link) {
      return NextResponse.json(
        {
          success: false,
          error: 'Enlace de invitación no encontrado',
          valid: false,
          reason: 'not_found'
        },
        { status: 404 }
      )
    }

    // Check if link is active
    if (link.status !== 'active') {
      let reason = 'inactive'
      let message = 'Este enlace de invitación no está activo'

      if (link.status === 'expired') {
        reason = 'expired'
        message = 'Este enlace de invitación ha expirado'
      } else if (link.status === 'exhausted') {
        reason = 'exhausted'
        message = 'Este enlace de invitación ha alcanzado el límite de registros'
      } else if (link.status === 'paused') {
        reason = 'paused'
        message = 'Este enlace de invitación está temporalmente pausado'
      }

      return NextResponse.json(
        { success: false, error: message, valid: false, reason },
        { status: 400 }
      )
    }

    // Check expiration
    if (new Date(link.expires_at) <= new Date()) {
      // Update status to expired
      await supabase
        .from('bulk_invite_links')
        .update({ status: 'expired' })
        .eq('id', link.id)

      return NextResponse.json(
        {
          success: false,
          error: 'Este enlace de invitación ha expirado',
          valid: false,
          reason: 'expired'
        },
        { status: 400 }
      )
    }

    // Check if max uses reached
    if (link.current_uses >= link.max_uses) {
      // Update status to exhausted
      await supabase
        .from('bulk_invite_links')
        .update({ status: 'exhausted' })
        .eq('id', link.id)

      return NextResponse.json(
        {
          success: false,
          error: 'Este enlace de invitación ha alcanzado el límite de registros',
          valid: false,
          reason: 'exhausted'
        },
        { status: 400 }
      )
    }

    // Link is valid
    const organization = link.organizations as any

    return NextResponse.json({
      success: true,
      valid: true,
      invite: {
        id: link.id,
        name: link.name,
        role: link.role,
        remainingUses: link.max_uses - link.current_uses,
        expiresAt: link.expires_at
      },
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.brand_logo_url || organization.logo_url || organization.brand_favicon_url || null,
        primaryColor: organization.brand_color_primary,
        accentColor: organization.brand_color_accent
      } : null
    })
  } catch (error) {
    console.error('Error in GET /api/invite/[token]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', valid: false },
      { status: 500 }
    )
  }
}

// POST - Accept an invite link (for authenticated users)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { userId } = body

    if (!token || !userId) {
      return NextResponse.json(
        { success: false, error: 'Token y userId son requeridos' },
        { status: 400 }
      )
    }

    const result = await consumeBulkInvitationAction(token, userId);

    if (!result.success) {
      const status = result.error?.includes('encontrado') ? 404 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Te has unido exitosamente a la organización',
      organizationSlug: result.organizationSlug || null
    })
  } catch (error) {
    console.error('Error in POST /api/invite/[token]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

