import type { NextFunction, Request, Response } from 'express';
import { createError } from '../errorHandler';

export const requireHierarchyEnabled = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.hierarchyContext) {
    return next(
      createError(
        'Contexto de organizacion requerido',
        400,
        'MISSING_ORGANIZATION_CONTEXT',
      ),
    );
  }

  if (!req.hierarchyContext.hierarchyEnabled) {
    return next(
      createError(
        'La jerarquia no esta activada para esta organizacion',
        400,
        'HIERARCHY_NOT_ENABLED',
      ),
    );
  }

  return next();
};
