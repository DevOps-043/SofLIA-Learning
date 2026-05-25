import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'

/**
 * DELETE /api/business/user-groups/[id]/members/[memberId]
 * Remueve un miembro del grupo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id: groupId, memberId } = await params

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el grupo exista y pertenezca a la organización
    const { data: group } = await supabase
      .from('user_groups')
      .select('id')
      .eq('id', groupId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (!group) {
      return NextResponse.json({
        success: false,
        error: 'Grupo no encontrado'
      }, { status: 404 })
    }

    // Verificar que el miembro exista
    const { data: member } = await supabase
      .from('user_group_members')
      .select('id')
      .eq('id', memberId)
      .eq('group_id', groupId)
      .single()

    if (!member) {
      return NextResponse.json({
        success: false,
        error: 'Miembro no encontrado'
      }, { status: 404 })
    }

    // Eliminar el miembro
    const { error: deleteError } = await supabase
      .from('user_group_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      logger.error('Error removing member:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al remover miembro'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Miembro removido exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/user-groups/[id]/members/[memberId] DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
