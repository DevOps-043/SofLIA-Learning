import { NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger';

import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'

interface OrganizationUserSummary {
  id: string
  organization_id?: string | null
}

export async function POST(request: Request) {
  try {
    // Verificar autenticación y autorización de Business
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    const userData: CreateBusinessUserRequest = {
      username: body.username,
      email: body.email,
      password: body.password,
      first_name: body.first_name,
      last_name: body.last_name,
      display_name: body.display_name,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
      job_title: body.job_title,
      org_role: body.org_role || 'member',
      send_invitation: body.send_invitation !== undefined ? body.send_invitation : !body.password
    }

    const newUser = await BusinessUsersServerService.createOrganizationUser(
      auth.organizationId,
      userData,
      auth.userId
    )

    return NextResponse.json({
      success: true,
      user: newUser
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/users POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear usuario'
      },
      { status: 500 }
    )
  }
}
