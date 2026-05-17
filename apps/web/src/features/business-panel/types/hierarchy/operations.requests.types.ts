interface BaseHierarchyLocationRequest {
  address?: string | null;
  city?: string | null;
  code?: string;
  country?: string | null;
  description?: string;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  metadata?: Record<string, unknown>;
  name?: string;
  phone?: string | null;
  postal_code?: string | null;
  state?: string | null;
}

export interface CreateRegionRequest extends BaseHierarchyLocationRequest {
  address?: string;
  city?: string;
  country?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  manager_id?: string;
  name: string;
  phone?: string;
  postal_code?: string;
  state?: string;
}

export interface UpdateRegionRequest extends BaseHierarchyLocationRequest {
  is_active?: boolean;
  manager_id?: string | null;
}

export interface CreateZoneRequest extends CreateRegionRequest {
  region_id: string;
}

export type UpdateZoneRequest = UpdateRegionRequest;

export interface CreateTeamRequest extends BaseHierarchyLocationRequest {
  address?: string;
  city?: string;
  country?: string;
  email?: string;
  latitude?: number;
  leader_id?: string;
  longitude?: number;
  max_members?: number;
  monthly_target?: number;
  name: string;
  phone?: string;
  postal_code?: string;
  state?: string;
  target_goal?: string;
  zone_id: string;
}

export interface UpdateTeamRequest extends BaseHierarchyLocationRequest {
  is_active?: boolean;
  leader_id?: string | null;
  max_members?: number | null;
  monthly_target?: number | null;
  target_goal?: string | null;
}

export interface AssignUserToTeamRequest {
  role?: 'team_leader' | 'member';
  team_id: string;
  update_scope?: boolean;
  user_id: string;
}

export interface AssignZoneManagerRequest {
  user_id: string;
  zone_id: string;
}

export interface AssignRegionalManagerRequest {
  region_id: string;
  user_id: string;
}
