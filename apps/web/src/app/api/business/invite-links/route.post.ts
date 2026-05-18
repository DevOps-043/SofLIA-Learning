import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
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

// POST - Create a new bulk invite link
async function handlePost(_request: NextRequest, body: InviteLinkCreateBody) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizacion asignada' },
        { status: 403 }
      )
    }

    // Only admins and owners can create invite links
    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para crear enlaces de invitacion' },
        { status: 403 }
      )
    }

    const { name, maxUses, role, expiresAt } = body
    const expirationDate = new Date(expiresAt)

    // Generate unique token
    const token = nanoid(32)

    const supabase = await createClient()
    const insertPayload: BulkInviteLinkInsert = {
      organization_id: auth.organizationId,
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
    techDebtLogger.error('Error in POST /api/business/invite-links:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export const POST = withZodBody(inviteLinkCreateSchema, handlePost)
