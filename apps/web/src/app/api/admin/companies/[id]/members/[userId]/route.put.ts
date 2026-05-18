import { logger as techDebtLogger } from '@/lib/utils/logger'
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
      techDebtLogger.error('Error updating member role:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Rol actualizado correctamente' })
  } catch (error) {
    techDebtLogger.error('Error in PUT /api/admin/companies/[id]/members/[userId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
