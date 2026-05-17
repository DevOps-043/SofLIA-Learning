import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'

import { nanoid } from 'nanoid'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId } = await params

    const body = await request.json()
    const { name, maxUses, role, expiresAt } = body

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

    const token = nanoid(32)
    const supabase = await createClient()

    const { data: link, error } = await supabase
      .from('bulk_invite_links')
      .insert({
        organization_id: companyId,
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
    console.error('Error in POST /api/admin/companies/[id]/invite-links:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
