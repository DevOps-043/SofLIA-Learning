import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { writeSecurityAuditLogAsync } from '@/lib/security/security-audit-log'
import { logger } from '@/lib/utils/logger'
import {
  AddMembershipError,
  addUserMembership,
} from '@/features/admin/services/admin-user-master-panel/add-user-membership.server'
import { AddUserMembershipSchema, type AddUserMembershipBody } from './schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

const userIdSchema = z.string().uuid()

/**
 * Agrega (o reactiva) la membresía de un usuario en una organización.
 * Exclusivo del Panel Maestro del superadmin; cambio de rol y remoción
 * reutilizan las rutas existentes de /api/admin/companies/[id]/members/[userId].
 */
async function handlePost(
  _request: NextRequest,
  body: AddUserMembershipBody,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const parsedUserId = userIdSchema.safeParse(id)
    if (!parsedUserId.success) {
      return apiError('INVALID_USER_ID', 'Identificador de usuario inválido.', 400)
    }

    const membership = await addUserMembership({
      userId: parsedUserId.data,
      organizationId: body.organizationId,
      role: body.role,
      jobTitle: body.jobTitle?.trim() || null,
      invitedBy: auth.userId,
    })

    writeSecurityAuditLogAsync({
      action: 'admin.user.membership_added',
      result: 'success',
      actorId: auth.userId,
      resourceType: 'organization_user',
      resourceId: parsedUserId.data,
      orgId: body.organizationId,
      metadata: { role: body.role, reactivated: membership.reactivated },
    })

    return NextResponse.json({ success: true, membership }, { status: 201 })
  } catch (error) {
    if (error instanceof AddMembershipError) {
      if (error.code === 'MEMBER_ALREADY_EXISTS') {
        return apiError('MEMBER_ALREADY_EXISTS', 'El usuario ya pertenece a esta organización.', 409)
      }
      return apiError(error.code, 'Usuario u organización no encontrados.', 404)
    }

    logger.error('Error in POST /api/admin/users/[id]/memberships:', error)
    return apiError('ADMIN_MEMBERSHIP_ADD_FAILED', 'Error al agregar el usuario a la organización.', 500)
  }
}

export const POST = withZodBody(AddUserMembershipSchema, handlePost)
