import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Validate an invite token (public endpoint)
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

    const supabase = await createClient()

    // 1. Validate the invite link
    const { data: link, error: linkError } = await supabase
      .from('bulk_invite_links')
      .select(`
        id,
        role,
        max_uses,
        current_uses,
        expires_at,
        status,
        organization_id
      `)
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return NextResponse.json(
        { success: false, error: 'Enlace de invitación no encontrado' },
        { status: 404 }
      )
    }

    if (link.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Este enlace de invitación no está activo' },
        { status: 400 }
      )
    }

    if (new Date(link.expires_at) <= new Date()) {
      await supabase.from('bulk_invite_links').update({ status: 'expired' }).eq('id', link.id)
      return NextResponse.json(
        { success: false, error: 'Este enlace de invitación ha expirado' },
        { status: 400 }
      )
    }

    if (link.current_uses >= link.max_uses) {
      await supabase.from('bulk_invite_links').update({ status: 'exhausted' }).eq('id', link.id)
      return NextResponse.json(
        { success: false, error: 'Este enlace ha alcanzado el límite de registros' },
        { status: 400 }
      )
    }

    // 2. Check the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // 3. Check if user is already in this organization
    const { data: existingMember } = await supabase
      .from('organization_users')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', link.organization_id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Ya perteneces a esta organización' },
        { status: 409 }
      )
    }

    // 4. Add user to organization
    const { error: insertError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: link.organization_id,
        user_id: userId,
        role: link.role || 'member',
        status: 'active',
        joined_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error adding user to organization:', insertError)
      return NextResponse.json(
        { success: false, error: 'Error al unirte a la organización' },
        { status: 500 }
      )
    }

    // 5. Update user cargo_rol to 'Business' if not already
    await supabase
      .from('users')
      .update({ cargo_rol: 'Business' })
      .eq('id', userId)
      .neq('cargo_rol', 'Administrador') // Don't overwrite platform admins

    // 6. Increment invite usage counter
    const { data: currentLink } = await supabase
      .from('bulk_invite_links')
      .select('current_uses')
      .eq('id', link.id)
      .single()

    if (currentLink) {
      await supabase
        .from('bulk_invite_links')
        .update({ current_uses: currentLink.current_uses + 1 })
        .eq('id', link.id)
    }

    // 7. Register in bulk_invite_registrations
    await supabase
      .from('bulk_invite_registrations')
      .insert({
        bulk_invite_link_id: link.id,
        user_id: userId,
      })

    // 8. Get org slug for redirect
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', link.organization_id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Te has unido exitosamente a la organización',
      organizationSlug: org?.slug || null
    })
  } catch (error) {
    console.error('Error in POST /api/invite/[token]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
