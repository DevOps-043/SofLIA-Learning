import type { HierarchyRole, HierarchyScope } from './core.types';

export interface UserHierarchyProfile {
  display_name?: string | null;
  email: string;
  first_name?: string | null;
  id: string;
  last_name?: string | null;
  profile_picture_url?: string | null;
  username: string;
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
  user?: UserHierarchyProfile;
  user_id: string;
  zone_id: string | null;
  zone_name?: string;
}
