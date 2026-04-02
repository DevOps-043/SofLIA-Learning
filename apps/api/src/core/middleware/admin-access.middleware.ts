import type { NextFunction, Request, Response } from 'express'

import {
  DatabaseError,
  ForbiddenError,
  UnauthorizedError,
} from '@/core/errors/app-error'
import { getServiceClient } from '@/core/supabase/service-client'

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase()
}

export function requireDatabaseRoles(...allowedRoles: string[]) {
  const normalizedAllowedRoles = new Set(
    allowedRoles
      .map((role) => normalizeRole(role))
      .filter((role): role is string => Boolean(role)),
  )

  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError('Usuario no autenticado'))
      return
    }

    try {
      const { data, error } = await getServiceClient()
        .from('users')
        .select('cargo_rol, is_banned')
        .eq('id', req.user.id)
        .maybeSingle()

      if (error) {
        next(
          new DatabaseError('Error al validar los permisos del usuario', error),
        )
        return
      }

      if (!data) {
        next(
          new ForbiddenError(
            'Usuario sin perfil valido para acceder a este recurso',
          ),
        )
        return
      }

      if (data.is_banned) {
        next(new ForbiddenError('Tu cuenta esta bloqueada'))
        return
      }

      if (!normalizedAllowedRoles.has(normalizeRole(data.cargo_rol) ?? '')) {
        next(new ForbiddenError())
        return
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
