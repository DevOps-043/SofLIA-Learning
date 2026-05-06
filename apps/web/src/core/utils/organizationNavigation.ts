type OrganizationRouteRole = 'owner' | 'admin' | 'member' | string | null | undefined;

interface OrganizationRouteTarget {
  slug: string;
  role?: OrganizationRouteRole;
}

export function isOrganizationAdminRole(role: OrganizationRouteRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function getOrganizationDashboardPath(organization: OrganizationRouteTarget): string {
  const panelSegment = isOrganizationAdminRole(organization.role)
    ? 'business-panel'
    : 'business-user';

  return `/${organization.slug}/${panelSegment}/dashboard`;
}

export function getOrganizationUserDashboardPath(organizationSlug: string): string {
  return `/${organizationSlug}/business-user/dashboard`;
}
