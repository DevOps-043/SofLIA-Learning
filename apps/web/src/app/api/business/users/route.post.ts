import { NextRequest, NextResponse } from 'next/server'

import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import type { CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

import { createBusinessUserSchema, type CreateBusinessUserBody } from './schema'

async function handlePost(_request: NextRequest, body: CreateBusinessUserBody) {
  const auth = await requireBusiness()
  if (auth instanceof NextResponse) return auth

  if (!auth.organizationId) {
    return apiError(
      'NO_ORGANIZATION',
      'No tienes una organización asignada',
      403,
    )
  }
  if (!auth.isOrgAdmin) {
    return apiError(
      'FORBIDDEN',
      'No tienes permisos para gestionar usuarios en esta organización.',
      403,
    )
  }
  if (!body.username?.trim() || !body.job_title?.trim()) {
    return apiError(
      'INVALID_USER_DATA',
      'El nombre de usuario y el cargo son obligatorios.',
      400,
    )
  }

  const requestedRole = body.org_role || 'member'
  const allowedRoles =
    auth.organizationRole === 'owner' || auth.userRole === 'Administrador'
      ? ['member', 'admin', 'owner']
      : ['member', 'admin']
  if (!allowedRoles.includes(requestedRole)) {
    return apiError(
      'FORBIDDEN_ROLE_ASSIGNMENT',
      `No tienes permisos para asignar el rol '${requestedRole}'.`,
      403,
    )
  }

  const userData: CreateBusinessUserRequest = {
    username: body.username.trim(),
    email: body.email,
    password: body.password,
    first_name: body.first_name,
    last_name: body.last_name,
    display_name: body.display_name ?? undefined,
    date_of_birth: body.date_of_birth ?? undefined,
    gender: body.gender ?? undefined,
    job_title: body.job_title.trim(),
    org_role: requestedRole,
    send_invitation:
      body.send_invitation !== undefined
        ? body.send_invitation
        : !body.password,
  }

  try {
    const newUser = await BusinessUsersServerService.createOrganizationUser(
      auth.organizationId,
      userData,
      auth.userId,
    )
    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    logger.error('Error in /api/business/users POST', error)
    return apiError(
      'CREATE_BUSINESS_USER_FAILED',
      error instanceof Error ? error.message : 'Error al crear usuario',
      500,
    )
  }
}

export const POST = withZodBody(createBusinessUserSchema, handlePost)
