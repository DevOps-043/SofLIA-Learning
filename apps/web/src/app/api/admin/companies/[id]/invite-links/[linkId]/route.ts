import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

interface RouteParams {
  params: Promise<{
    id: string
    linkId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId, linkId } = await params
    const supabase = await createClient()

    const { data: link, error } = await supabase
      .from('bulk_invite_links')
      .select('*')
      .eq('id', linkId)
      .eq('organization_id', companyId)
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
    console.error('Error in GET /api/admin/companies/[id]/invite-links/[linkId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId, linkId } = await params
    const body = await request.json()
    const { action, name, maxUses, expiresAt } = body

    const supabase = await createClient()

    const { data: existingLink, error: fetchError } = await supabase
      .from('bulk_invite_links')
      .select('*')
      .eq('id', linkId)
      .eq('organization_id', companyId)
      .single()

    if (fetchError || !existingLink) {
      return NextResponse.json(
        { success: false, error: 'Enlace no encontrado' },
        { status: 404 }
      )
    }

    let updateData: Record<string, any> = {}

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
      if (new Date(existingLink.expires_at) <= new Date()) {
        updateData.status = 'expired'
      } else if (existingLink.current_uses >= existingLink.max_uses) {
        updateData.status = 'exhausted'
      } else {
        updateData.status = 'active'
      }
    } else {
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
      .eq('id', linkId)
      .eq('organization_id', companyId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating bulk invite link:', updateError)
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
    console.error('Error in PATCH /api/admin/companies/[id]/invite-links/[linkId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId, linkId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('bulk_invite_links')
      .delete()
      .eq('id', linkId)
      .eq('organization_id', companyId)

    if (error) {
      console.error('Error deleting bulk invite link:', error)
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
    console.error('Error in DELETE /api/admin/companies/[id]/invite-links/[linkId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
