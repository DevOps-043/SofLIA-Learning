import type { NextFunction, Request, Response } from 'express';
import type { HierarchyContext } from './types';

export const loadHierarchyContext = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      req.hierarchyContext = undefined;
      return next();
    }

    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      req.hierarchyContext = undefined;
      return next();
    }

    req.hierarchyContext = buildPlaceholderHierarchyContext(organizationId);
    return next();
  } catch (error) {
    console.error('Error loading hierarchy context:', error);
    req.hierarchyContext = undefined;
    return next();
  }
};

function resolveOrganizationId(req: Request): string | undefined {
  return (
    (req.headers['x-organization-id'] as string | undefined) ||
    req.params.organizationId ||
    (req.query.organizationId as string | undefined)
  );
}

function buildPlaceholderHierarchyContext(organizationId: string): HierarchyContext {
  return {
    organizationId,
    hierarchyEnabled: false,
    userRole: 'member',
    scope: 'organization',
    accessibleTeamIds: null,
  };
}
