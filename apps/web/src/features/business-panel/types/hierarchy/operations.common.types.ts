export interface HierarchyResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface HierarchyListResponse<T> {
  error?: string;
  items: T[];
  limit?: number;
  page?: number;
  success: boolean;
  total: number;
}

export interface SeedHierarchyResponse {
  error?: string;
  regionId?: string;
  success: boolean;
  teamId?: string;
  usersUpdated?: number;
  zoneId?: string;
}

export type HierarchyAction =
  | 'hierarchy_enabled'
  | 'hierarchy_disabled'
  | 'region_created'
  | 'region_updated'
  | 'region_deleted'
  | 'zone_created'
  | 'zone_updated'
  | 'zone_deleted'
  | 'team_created'
  | 'team_updated'
  | 'team_deleted'
  | 'user_assigned_to_team'
  | 'user_removed_from_team'
  | 'user_role_changed'
  | 'manager_assigned'
  | 'leader_assigned'
  | 'default_structure_created';
