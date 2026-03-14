import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { nanoid } from 'nanoid'

// GET - List all bulk invite links for the organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    const { data: links, error } = await supabase
      .from('bulk_invite_links')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bulk invite links:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener enlaces de invitación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      links: links || []
    })
  } catch (error) {
    console.error('Error in GET /api/[orgSlug]/business/invite-links:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Create a new bulk invite link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    // Only admins and owners can create invite links
    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para crear enlaces de invitación' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, maxUses, role, expiresAt } = body

    // Validate required fields
    if (!maxUses || maxUses < 1 || maxUses > 10000) {
      return NextResponse.json(
        { success: false, error: 'El número máximo de usos debe estar entre 1 y 10000' },
        { status: 400 }
      )
    }

    if (!role || !['member', 'admin', 'owner'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Rol inválido' },
        { status: 400 }
      )
    }

    if (!expiresAt) {
      return NextResponse.json(
        { success: false, error: 'La fecha de expiración es requerida' },
        { status: 400 }
      )
    }

    const expirationDate = new Date(expiresAt)
    if (expirationDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'La fecha de expiración debe ser en el futuro' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = nanoid(32)

    const supabase = await createClient()

    const { data: link, error } = await supabase
      .from('bulk_invite_links')
      .insert({
        organization_id: auth.organizationId,
        created_by: auth.userId,
        token,
        name: name || null,
        max_uses: maxUses,
        role,
        expires_at: expirationDate.toISOString(),
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bulk invite link:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear el enlace de invitación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      link
    })
  } catch (error) {
    console.error('Error in POST /api/[orgSlug]/business/invite-links:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
