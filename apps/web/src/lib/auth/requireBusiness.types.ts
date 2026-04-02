export type OrganizationMembershipRole = 'owner' | 'admin' | 'member';

export interface BusinessAuth {
  userId: string;
  userEmail: string;
  userRole: string;
  organizationId?: string;
  organizationSlug?: string;
  organizationRole?: OrganizationMembershipRole;
  isOrgAdmin?: boolean;
}

export interface RequireBusinessOptions {
  organizationId?: string;
  organizationSlug?: string;
}

export interface RequireBusinessUserOptions extends RequireBusinessOptions {}

export interface BusinessAccessStrategy {
  fallbackRoleForPlatformAdmin: OrganizationMembershipRole;
  successLogMessage: string;
  errorLogMessage: string;
  invalidRoleLogMessage: string;
  logPrefix: string;
  invalidLegacySessionMessage: string;
  revokedSessionMessage: string;
}
