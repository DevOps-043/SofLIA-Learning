import type { HierarchyRole, HierarchyScope } from './core.types';

export interface HierarchyStats {
  hierarchy_enabled: boolean;
  regions_count: number;
  teams_count: number;
  users_assigned: number;
  users_unassigned: number;
  zones_count: number;
}

export interface HierarchyAnalytics {
  active_learners: number;
  active_teams?: number;
  active_zones?: number;
  assignment_completion_rate?: number;
  assignments_due_soon?: number;
  assignments_overdue?: number;
  avg_active_days?: number;
  avg_completion: number;
  avg_hours_per_member?: number;
  avg_hours_per_team?: number;
  avg_hours_per_zone?: number;
  avg_session_duration?: number;
  avg_streak?: number;
  completion_rate?: number;
  courses_assigned?: number;
  courses_completed?: number;
  courses_in_progress?: number;
  courses_not_started?: number;
  inactive_teams?: number;
  inactive_users?: number;
  inactive_zones?: number;
  last_activity?: string;
  lessons_completed?: number;
  longest_streak?: number;
  participation_rate?: number;
  sessions_completed?: number;
  sessions_missed?: number;
  team_ranking?: Array<{
    completion_rate: number;
    hours: number;
    id: string;
    name: string;
    participation_rate: number;
  }>;
  top_performer:
    | {
        avatar?: string;
        completion_rate?: number;
        courses_completed?: number;
        id: string;
        label: string;
        name: string;
        value: number;
      }
    | null;
  total_hours: number;
  total_teams?: number;
  total_zones?: number;
  users_count: number;
  zone_ranking?: Array<{
    completion_rate: number;
    hours: number;
    id: string;
    name: string;
    participation_rate: number;
  }>;
}

export interface HierarchyCourse {
  avg_progress: number;
  category: string;
  enrolled_count: number;
  id: string;
  status: string;
  thumbnail_url: string | null;
  title: string;
}

export interface HierarchyConfig {
  auto_assign_new_users?: boolean;
  default_region_id?: string;
  default_team_id?: string;
  default_zone_id?: string;
  hierarchy_enabled: boolean;
  labels?: {
    region?: string;
    team?: string;
    zone?: string;
  };
  require_team_assignment?: boolean;
}

export interface CreateRegionRequest {
  address?: string;
  city?: string;
  code?: string;
  country?: string;
  description?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  manager_id?: string;
  metadata?: Record<string, unknown>;
  name: string;
  phone?: string;
  postal_code?: string;
  state?: string;
}

export interface UpdateRegionRequest {
  address?: string | null;
  city?: string | null;
  code?: string;
  country?: string | null;
  description?: string;
  email?: string | null;
  is_active?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  manager_id?: string | null;
  metadata?: Record<string, unknown>;
  name?: string;
  phone?: string | null;
  postal_code?: string | null;
  state?: string | null;
}

export interface CreateZoneRequest {
  address?: string;
  city?: string;
  code?: string;
  country?: string;
  description?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  manager_id?: string;
  metadata?: Record<string, unknown>;
  name: string;
  phone?: string;
  postal_code?: string;
  region_id: string;
  state?: string;
}

export interface UpdateZoneRequest {
  address?: string | null;
  city?: string | null;
  code?: string;
  country?: string | null;
  description?: string;
  email?: string | null;
  is_active?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  manager_id?: string | null;
  metadata?: Record<string, unknown>;
  name?: string;
  phone?: string | null;
  postal_code?: string | null;
  state?: string | null;
}

export interface CreateTeamRequest {
  address?: string;
  city?: string;
  code?: string;
  country?: string;
  description?: string;
  email?: string;
  latitude?: number;
  leader_id?: string;
  longitude?: number;
  max_members?: number;
  metadata?: Record<string, unknown>;
  monthly_target?: number;
  name: string;
  phone?: string;
  postal_code?: string;
  state?: string;
  target_goal?: string;
  zone_id: string;
}

export interface UpdateTeamRequest {
  address?: string | null;
  city?: string | null;
  code?: string;
  country?: string | null;
  description?: string;
  email?: string | null;
  is_active?: boolean;
  latitude?: number | null;
  leader_id?: string | null;
  longitude?: number | null;
  max_members?: number | null;
  metadata?: Record<string, unknown>;
  monthly_target?: number | null;
  name?: string;
  phone?: string | null;
  postal_code?: string | null;
  state?: string | null;
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

export interface ListRegionsOptions {
  includeInactive?: boolean;
  withCounts?: boolean;
  withManager?: boolean;
}

export interface ListZonesOptions {
  includeInactive?: boolean;
  regionId?: string;
  withCounts?: boolean;
  withManager?: boolean;
}

export interface ListTeamsOptions {
  includeInactive?: boolean;
  regionId?: string;
  withCounts?: boolean;
  withLeader?: boolean;
  zoneId?: string;
}

export interface ListUnassignedUsersOptions {
  excludeOwners?: boolean;
  status?: 'active' | 'all';
}

export interface UserWithHierarchy {
  effective_region_id?: string;
  effective_zone_id?: string;
  hierarchy_scope: HierarchyScope | null;
  id: string;
  job_title?: string | null;
  organization_id: string;
  region_id: string | null;
  region_name?: string;
  role: HierarchyRole;
  status: 'active' | 'invited' | 'suspended' | 'removed';
  team_id: string | null;
  team_name?: string;
  user?: {
    display_name?: string | null;
    email: string;
    first_name?: string | null;
    id: string;
    last_name?: string | null;
    profile_picture_url?: string | null;
    username: string;
  };
  user_id: string;
  zone_id: string | null;
  zone_name?: string;
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
