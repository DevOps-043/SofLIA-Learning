import type { NextFunction, Request, Response } from 'express';
import { createError } from '../errorHandler';
import type { HierarchyRole } from './types';

export const requireHierarchyRole = (...allowedRoles: HierarchyRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.hierarchyContext) {
      return next(
        createError(
          'Contexto de organizacion requerido',
          400,
          'MISSING_ORGANIZATION_CONTEXT',
        ),
      );
    }

    if (!allowedRoles.includes(req.hierarchyContext.userRole)) {
      return next(
        createError(
          'No tienes el rol necesario para esta accion',
          403,
          'INSUFFICIENT_ROLE',
        ),
      );
    }

    return next();
  };
};
