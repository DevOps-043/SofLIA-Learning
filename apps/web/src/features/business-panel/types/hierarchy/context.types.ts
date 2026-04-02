import type { HierarchyRole, HierarchyScope } from './core.types';

export interface HierarchyContext {
  accessibleTeamIds: string[];
  hasUnlimitedAccess?: boolean;
  hierarchyEnabled: boolean;
  organizationId: string;
  organizationName?: string;
  regionId: string | null;
  regionName?: string;
  scope: HierarchyScope;
  teamId: string | null;
  teamName?: string;
  userRole: HierarchyRole;
  zoneId: string | null;
  zoneName?: string;
}

export interface ResourceScope {
  organizationId: string;
  regionId?: string | null;
  teamId?: string | null;
  zoneId?: string | null;
}
