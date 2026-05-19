import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { userGroupMemberUpdateSchema, type UserGroupMemberUpdateBody } from './schema'

/**
 * PUT /api/business/user-groups/[id]/members/[memberId]
 * Actualiza el rol de un miembro del grupo
 */
async function handlePut(
  _request: NextRequest,
  body: UserGroupMemberUpdateBody,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id: groupId, memberId } = await params

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'Usuario no pertenece a ninguna organización', 400)
    }

    const supabase = await createClient()
    const { role } = body

    // Verificar que el grupo exista y pertenezca a la organización
    const { data: group } = await supabase
      .from('user_groups')
      .select('id')
      .eq('id', groupId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (!group) {
      return apiError('GROUP_NOT_FOUND', 'Grupo no encontrado', 404)
    }

    // Verificar que el miembro exista
    const { data: member } = await supabase
      .from('user_group_members')
      .select('id, user_id')
      .eq('id', memberId)
      .eq('group_id', groupId)
      .single()

    if (!member) {
      return apiError('MEMBER_NOT_FOUND', 'Miembro no encontrado', 404)
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
      return apiError('UPDATE_MEMBER_ROLE_FAILED', 'Error al actualizar el rol', 500)
    }

    return NextResponse.json({
      success: true,
      member: updatedMember
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/user-groups/[id]/members/[memberId] PUT:', error)
    return apiError('UPDATE_MEMBER_ROLE_FAILED', 'Error interno del servidor', 500)
  }
}

export const PUT = withZodBody(userGroupMemberUpdateSchema, handlePut)
