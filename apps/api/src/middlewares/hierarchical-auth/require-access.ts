import type { NextFunction, Request, Response } from 'express';
import { createError } from '../errorHandler';
import { checkHierarchicalAccess } from './access';
import type { ResourceScope } from './types';

export const requireHierarchicalAccess = (
  getResourceScope: (req: Request) => ResourceScope | Promise<ResourceScope>,
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const resourceScope = await getResourceScope(req);
      const { hasAccess, reason, code } = checkHierarchicalAccess(
        req.hierarchyContext,
        resourceScope,
      );

      if (!hasAccess) {
        return next(
          createError(
            reason || 'No tienes acceso a este recurso',
            403,
            code || 'HIERARCHICAL_ACCESS_DENIED',
          ),
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
