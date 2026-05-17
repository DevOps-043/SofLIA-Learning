export type HierarchyRole =
  | 'owner'
  | 'admin'
  | 'regional_manager'
  | 'zone_manager'
  | 'team_leader'
  | 'member';

export type HierarchyScope = 'organization' | 'region' | 'zone' | 'team';

export interface HierarchyContext {
  organizationId: string;
  organizationName?: string;
  hierarchyEnabled: boolean;
  userRole: HierarchyRole;
  scope: HierarchyScope;
  regionId?: string;
  zoneId?: string;
  teamId?: string;
  regionName?: string;
  zoneName?: string;
  teamName?: string;
  accessibleTeamIds: string[] | null;
}

export interface ResourceScope {
  organizationId: string;
  regionId?: string | null;
  zoneId?: string | null;
  teamId?: string | null;
}

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  code?: string;
}

export interface HierarchyWhereClause {
  clause: string;
  params: Record<string, string | string[]>;
}

declare global {
  namespace Express {
    interface Request {
      hierarchyContext?: HierarchyContext;
    }
  }
}
