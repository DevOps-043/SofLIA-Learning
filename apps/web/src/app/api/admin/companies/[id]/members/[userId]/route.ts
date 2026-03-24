import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

interface RouteParams {
  params: Promise<{
    id: string
    userId: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId, userId } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['member', 'admin', 'owner'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Rol inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Verify member exists in this company
    const { data: member, error: fetchError } = await supabase
      .from('organization_users')
      .select('id, user_id, role')
      .eq('organization_id', companyId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !member) {
      return NextResponse.json(
        { success: false, error: 'Miembro no encontrado en esta empresa' },
        { status: 404 }
      )
    }

    if (member.role === role) {
      return NextResponse.json({ success: true, message: 'Ningún cambio necesario' })
    }

    // 2. Update role
    const { error: updateError } = await supabase
      .from('organization_users')
      .update({ role })
      .eq('organization_id', companyId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Rol actualizado correctamente' })
  } catch (error) {
    console.error('Error in PUT /api/admin/companies/[id]/members/[userId]:', error)
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

    const { id: companyId, userId } = await params
    const supabase = await createClient()

    // 1. Verify member exists in this company
    const { data: member, error: fetchError } = await supabase
      .from('organization_users')
      .select('id, user_id, role')
      .eq('organization_id', companyId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !member) {
      return NextResponse.json(
        { success: false, error: 'Miembro no encontrado en esta empresa' },
        { status: 404 }
      )
    }

    // 2. Prevent removing the last owner? (Optional, superadmin could force it)
    if (member.role === 'owner') {
      const { count } = await supabase
        .from('organization_users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', companyId)
        .eq('role', 'owner')

      if (count && count <= 1) {
        return NextResponse.json(
          { success: false, error: 'No puedes eliminar al único propietario de la empresa' },
          { status: 400 }
        )
      }
    }

    // 3. Delete member
    const { error: deleteError } = await supabase
      .from('organization_users')
      .delete()
      .eq('organization_id', companyId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting member:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/companies/[id]/members/[userId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
