import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'

/**
 * PUT /api/business/user-groups/[id]/members/[memberId]
 * Actualiza el rol de un miembro del grupo
 */
export async function PUT(
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
    const body = await request.json()
    const { role } = body

    if (!role || (role !== 'leader' && role !== 'member')) {
      return NextResponse.json({
        success: false,
        error: 'role debe ser "leader" o "member"'
      }, { status: 400 })
    }

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
      .select('id, user_id')
      .eq('id', memberId)
      .eq('group_id', groupId)
      .single()

    if (!member) {
      return NextResponse.json({
        success: false,
        error: 'Miembro no encontrado'
      }, { status: 404 })
    }

    // Actualizar el rol
    const { data: updatedMember, error: updateError } = await supabase
      .from('user_group_members')
      .update({ role })
      .eq('id', memberId)
      .select(`
        id,
        group_id,
        user_id,
        role,
        joined_at,
        added_by,
        created_at,
        users!user_group_members_user_id_fkey (
          id,
          username,
          email,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single()

    if (updateError || !updatedMember) {
      logger.error('Error updating member role:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el rol'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      member: updatedMember
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/user-groups/[id]/members/[memberId] PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
