import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { nanoid } from 'nanoid'

// GET - List all bulk invite links for the organization
export async function GET() {
  try {
    const auth = await requireBusiness()
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
      .select('id, code, role, max_uses, used_count, expires_at, created_at, created_by, is_active')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
      .limit(100)

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
    console.error('Error in GET /api/business/invite-links:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
