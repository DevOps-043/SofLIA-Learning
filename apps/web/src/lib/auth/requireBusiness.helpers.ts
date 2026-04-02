import { NextResponse } from 'next/server';

import type { BusinessAuth } from './requireBusiness.types';

interface AuthenticatedUserRow {
  id: string;
  email?: string | null;
  cargo_rol?: string | null;
}

interface ResolvedOrganizationAccess {
  organizationId?: string;
  organizationSlug?: string;
  organizationRole?: BusinessAuth['organizationRole'];
}

export function createAuthErrorResponse(
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export function normalizeBusinessRole(role?: string | null): string {
  return role?.toLowerCase().trim() || '';
}

export function evaluateBusinessRoleAccess(role?: string | null) {
  const normalizedRole = normalizeBusinessRole(role);
  const isBusiness = normalizedRole === 'business';
  const isPlatformAdmin = normalizedRole === 'administrador';

  return {
    normalizedRole,
    isBusiness,
    isPlatformAdmin,
    isAllowed: isBusiness || isPlatformAdmin,
  };
}

export function buildBusinessAuth(
  user: AuthenticatedUserRow,
  organization: ResolvedOrganizationAccess
): BusinessAuth {
  const isOrgAdmin =
    organization.organizationRole === 'owner' ||
    organization.organizationRole === 'admin';

  return {
    userId: user.id,
    userEmail: user.email ?? '',
    userRole: user.cargo_rol ?? '',
    organizationId: organization.organizationId,
    organizationSlug: organization.organizationSlug,
    organizationRole: organization.organizationRole,
    isOrgAdmin,
  };
}
