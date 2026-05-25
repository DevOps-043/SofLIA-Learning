import { NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger';

import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'

interface OrganizationUserSummary {
  id: string
  organization_id?: string | null
}

export async function GET() {
  try {
    // Verificar autenticación y autorización de Business
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth


    logger.log('🔄 Cargando usuarios de organización desde API...')

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }

    // Validación adicional de seguridad: asegurar que organizationId no sea null/undefined
    if (!auth.organizationId || typeof auth.organizationId !== 'string') {
      logger.error('🚨 ERROR DE SEGURIDAD: organizationId inválido')
      return NextResponse.json(
        {
          success: false,
          error: 'Organización inválida'
        },
        { status: 403 }
      )
    }

    const [users, stats] = await Promise.all([
      BusinessUsersServerService.getOrganizationUsers(auth.organizationId),
      BusinessUsersServerService.getOrganizationStats(auth.organizationId)
    ])

    logger.log('✅ Usuarios de organización cargados:', users?.length || 0)
    logger.log('🔒 Validación de seguridad: Solo usuarios de organización', auth.organizationId)

    // Validación final: asegurar que todos los usuarios pertenecen a la organización correcta
    const validatedUsers = (users || []).filter((user: OrganizationUserSummary) => {
      const belongsToOrg = !user.organization_id || user.organization_id === auth.organizationId
      if (!belongsToOrg) {
        logger.error('🚨 ERROR DE SEGURIDAD: Usuario con organization_id incorrecto filtrado', {
          user_id: user.id,
          user_org: user.organization_id,
          expected_org: auth.organizationId
        })
      }
      return belongsToOrg
    })

    return NextResponse.json({
      success: true,
      users: validatedUsers,
      stats: stats || {}
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/users:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener usuarios de la organización',
        users: []
      },
      { status: 500 }
    )
  }
}
