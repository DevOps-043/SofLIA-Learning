import type { NextFunction, Request, Response } from 'express'

import { ForbiddenError, UnauthorizedError } from '@/core/errors/app-error'

function normalizeRole(role: string) {
  return role.trim().toLowerCase()
}

export function requireRoles(...allowedRoles: string[]) {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole)

  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError('Usuario no autenticado'))
      return
    }

    if (!normalizedAllowedRoles.includes(normalizeRole(req.user.role))) {
      next(new ForbiddenError())
      return
    }

    next()
  }
}
