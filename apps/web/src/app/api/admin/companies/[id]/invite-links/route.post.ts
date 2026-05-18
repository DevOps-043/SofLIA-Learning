import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withZodBody } from '@/lib/api/with-validation'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { fromLoose } from '@/lib/supabase/looseQuery'

import { nanoid } from 'nanoid'
import {
  inviteLinkCreateSchema,
  type BulkInviteLinkInsert,
  type BulkInviteLinkRow,
  type InviteLinkCreateBody,
} from './schema'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

async function handlePost(
  _request: NextRequest,
  body: InviteLinkCreateBody,
  { params }: RouteParams
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId } = await params
    const { name, maxUses, role, expiresAt } = body
    const expirationDate = new Date(expiresAt)

    const token = nanoid(32)
    const supabase = await createClient()
    const insertPayload: BulkInviteLinkInsert = {
      organization_id: companyId,
      created_by: auth.userId,
      token,
      name: name || null,
      max_uses: maxUses,
      role,
      expires_at: expirationDate.toISOString(),
      status: 'active'
    }

    const { data: link, error } = await fromLoose<BulkInviteLinkRow, BulkInviteLinkInsert>(
      supabase,
      'bulk_invite_links'
    )
      .insert(insertPayload)
      .select(SELECT_COLUMNS.bulk_invite_links)
      .single()

    if (error) {
      techDebtLogger.error('Error creating bulk invite link:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear el enlace de invitacion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      link
    })
  } catch (error) {
    techDebtLogger.error('Error in POST /api/admin/companies/[id]/invite-links:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export const POST = withZodBody<InviteLinkCreateBody, RouteParams>(
  inviteLinkCreateSchema,
  handlePost
)
