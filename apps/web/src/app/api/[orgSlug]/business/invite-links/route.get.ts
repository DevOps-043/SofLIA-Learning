import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { nanoid } from 'nanoid'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

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

    // bulk_invite_links perdio sus grants para `authenticated` en la migracion
    // 20260827120000_emergency_data_api_lockdown; se usa el cliente de service
    // role, ya autorizado por requireBusiness() arriba.
    const supabase = createAdminClient()

    const { data: links, error } = await supabase
      .from('bulk_invite_links')
      .select(SELECT_COLUMNS.bulk_invite_links)
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      techDebtLogger.error('Error fetching bulk invite links:', error)
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
    techDebtLogger.error('Error in GET /api/[orgSlug]/business/invite-links:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
