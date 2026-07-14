import type { NextFunction, Request, Response } from 'express'

import {
  DatabaseError,
  ForbiddenError,
  UnauthorizedError,
  createError,
} from '@/core/errors/app-error'
import { getServiceClient } from '@/core/supabase/service-client'

interface OrganizationAccessOptions {
  orgIdParam?: string
  allowedPlatformRoles?: string[]
}

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? ''
}

export function requireOrganizationAccess(
  options: OrganizationAccessOptions = {},
) {
  const orgIdParam = options.orgIdParam ?? 'orgId'
  const allowedPlatformRoles = new Set(
    (options.allowedPlatformRoles ?? ['administrador', 'admin', 'superadmin'])
      .map((role) => normalizeRole(role))
      .filter(Boolean),
  )

  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError('Usuario no autenticado'))
      return
    }

    const orgId = req.params[orgIdParam]?.trim()

    if (!orgId) {
      next(
        createError(
          'Identificador de organizacion requerido',
          400,
          'MISSING_ORGANIZATION_ID',
        ),
      )
      return
    }

    try {
      const client = getServiceClient()
      const [userResult, membershipResult] = await Promise.all([
        client
          .from('users')
          .select('platform_role, is_banned')
          .eq('id', req.user.id)
          .maybeSingle(),
        client
          .from('organization_users')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', req.user.id)
          .eq('status', 'active')
          .maybeSingle(),
      ])

      if (userResult.error) {
        next(new DatabaseError('Error al validar el usuario autenticado', userResult.error))
        return
      }

      if (!userResult.data) {
        next(new ForbiddenError('Usuario sin perfil valido'))
        return
      }

      if (userResult.data.is_banned) {
        next(new ForbiddenError('Tu cuenta esta bloqueada'))
        return
      }

      if (membershipResult.error) {
        next(
          new DatabaseError(
            'Error al validar acceso a la organizacion',
            membershipResult.error,
          ),
        )
        return
      }

      const isPlatformRoleAllowed = allowedPlatformRoles.has(
        normalizeRole(userResult.data.platform_role),
      )

      if (membershipResult.data || isPlatformRoleAllowed) {
        next()
        return
      }

      next(new ForbiddenError('No tienes acceso a esta organizacion'))
    } catch (error) {
      next(error)
    }
  }
}
