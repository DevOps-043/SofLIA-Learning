import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

import {
  updateMemberRoleSchema,
  type UpdateMemberRoleBody,
} from '../../../schema'

type RouteContext = { params: Promise<{ id: string; userId: string }> }

async function handlePut(
  _request: NextRequest,
  body: UpdateMemberRoleBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId, userId } = await context.params

  try {
    const supabase = await createClient()

    const { data: member, error: fetchError } = await supabase
      .from('organization_users')
      .select('id, user_id, role')
      .eq('organization_id', companyId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !member) {
      return apiError(
        'MEMBER_NOT_FOUND',
        'Miembro no encontrado en esta empresa',
        404,
      )
    }

    if (member.role === body.role) {
      return NextResponse.json({
        success: true,
        message: 'Ningún cambio necesario',
      })
    }

    const { error: updateError } = await supabase
      .from('organization_users')
      .update({ role: body.role })
      .eq('organization_id', companyId)
      .eq('user_id', userId)

    if (updateError) {
      logger.error('Error updating member role', updateError)
      return apiError(
        'UPDATE_MEMBER_ROLE_FAILED',
        'Error al actualizar el usuario',
        500,
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Rol actualizado correctamente',
    })
  } catch (error) {
    logger.error(
      'Error in PUT /api/admin/companies/[id]/members/[userId]',
      error,
    )
    return apiError('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export const PUT = withZodBody(updateMemberRoleSchema, handlePut)
