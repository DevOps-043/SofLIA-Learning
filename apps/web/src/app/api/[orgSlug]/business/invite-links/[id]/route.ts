import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/logger'
import { withZodBody } from '@/lib/api/with-validation'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import {
  inviteLinkPatchSchema,
  type InviteLinkPatchBody,
  type InviteLinkUpdateData,
} from './schema'

// GET - Get a specific invite link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id } = await params

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

    const { data: link, error } = await supabase
      .from('bulk_invite_links')
      .select(SELECT_COLUMNS.bulk_invite_links)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (error || !link) {
      return NextResponse.json(
        { success: false, error: 'Enlace no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      link
    })
  } catch (error) {
    logger.error('Error in GET /api/[orgSlug]/business/invite-links/[id]', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Update an invite link (pause, resume, etc.)
async function handlePatch(
  request: NextRequest,
  body: InviteLinkPatchBody,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para modificar enlaces de invitación' },
        { status: 403 }
      )
    }

    const { action, name, maxUses, expiresAt } = body

    // bulk_invite_links perdio sus grants para `authenticated` en la migracion
    // 20260827120000_emergency_data_api_lockdown; se usa el cliente de service
    // role, ya autorizado por requireBusiness() arriba.
    const supabase = createAdminClient()

    // First verify the link belongs to this organization
    const { data: existingLink, error: fetchError } = await supabase
      .from('bulk_invite_links')
      .select(SELECT_COLUMNS.bulk_invite_links)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (fetchError || !existingLink) {
      return NextResponse.json(
        { success: false, error: 'Enlace no encontrado' },
        { status: 404 }
      )
    }

    const updateData: InviteLinkUpdateData = {}

    // Handle actions
    if (action === 'pause') {
      if (existingLink.status !== 'active') {
        return NextResponse.json(
          { success: false, error: 'Solo se pueden pausar enlaces activos' },
          { status: 400 }
        )
      }
      updateData.status = 'paused'
    } else if (action === 'resume') {
      if (existingLink.status !== 'paused') {
        return NextResponse.json(
          { success: false, error: 'Solo se pueden reanudar enlaces pausados' },
          { status: 400 }
        )
      }
      // Check if link hasn't expired or exhausted
      if (new Date(existingLink.expires_at) <= new Date()) {
        updateData.status = 'expired'
      } else if (existingLink.current_uses >= existingLink.max_uses) {
        updateData.status = 'exhausted'
      } else {
        updateData.status = 'active'
      }
    } else {
      // Handle field updates
      if (name !== undefined) updateData.name = name
      if (maxUses !== undefined) {
        if (maxUses < existingLink.current_uses) {
          return NextResponse.json(
            { success: false, error: 'El máximo de usos no puede ser menor que los usos actuales' },
            { status: 400 }
          )
        }
        updateData.max_uses = maxUses
      }
      if (expiresAt !== undefined) {
        const newExpiration = new Date(expiresAt)
        if (newExpiration <= new Date()) {
          return NextResponse.json(
            { success: false, error: 'La fecha de expiración debe ser en el futuro' },
            { status: 400 }
          )
        }
        updateData.expires_at = newExpiration.toISOString()
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      )
    }

    const { data: link, error: updateError } = await supabase
      .from('bulk_invite_links')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating bulk invite link', updateError, {
        linkId: id,
        organizationId: auth.organizationId,
        orgSlug,
      })
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el enlace' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      link
    })
  } catch (error) {
    logger.error('Error in PATCH /api/[orgSlug]/business/invite-links/[id]', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export const PATCH = withZodBody(inviteLinkPatchSchema, handlePatch)

// DELETE - Delete an invite link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para eliminar enlaces de invitación' },
        { status: 403 }
      )
    }

    // bulk_invite_links perdio sus grants para `authenticated` en la migracion
    // 20260827120000_emergency_data_api_lockdown; se usa el cliente de service
    // role, ya autorizado por requireBusiness() arriba.
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('bulk_invite_links')
      .delete()
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (error) {
      logger.error('Error deleting bulk invite link', error, {
        linkId: id,
        organizationId: auth.organizationId,
        orgSlug,
      })
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el enlace' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Enlace eliminado correctamente'
    })
  } catch (error) {
    logger.error('Error in DELETE /api/[orgSlug]/business/invite-links/[id]', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
