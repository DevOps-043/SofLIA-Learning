import type {
  ContactInfo,
  LocationInfo,
  ManagerInfo,
} from './core.types';

export interface Region extends LocationInfo, ContactInfo {
  code?: string | null;
  created_at: string;
  created_by?: string | null;
  description?: string | null;
  id: string;
  is_active: boolean;
  manager?: ManagerInfo | null;
  manager_id?: string | null;
  metadata?: Record<string, unknown>;
  name: string;
  organization_id: string;
  teams_count?: number;
  updated_at: string;
  users_count?: number;
  zones_count?: number;
}

export interface Zone extends LocationInfo, ContactInfo {
  code?: string | null;
  created_at: string;
  created_by?: string | null;
  description?: string | null;
  id: string;
  is_active: boolean;
  manager?: ManagerInfo | null;
  manager_id?: string | null;
  metadata?: Record<string, unknown>;
  name: string;
  organization_id: string;
  region?: Region;
  region_id: string;
  teams_count?: number;
  updated_at: string;
  users_count?: number;
}

export interface Team extends LocationInfo, ContactInfo {
  capacity_percentage?: number | null;
  code?: string | null;
  created_at: string;
  created_by?: string | null;
  description?: string | null;
  id: string;
  is_active: boolean;
  leader?: ManagerInfo | null;
  leader_id?: string | null;
  max_members?: number | null;
  members_count?: number;
  metadata?: Record<string, unknown>;
  monthly_target?: number | null;
  name: string;
  organization_id: string;
  target_goal?: string | null;
  updated_at: string;
  zone?: Zone;
  zone_id: string;
}

export interface HierarchyTree {
  regions: (Region & {
    zones: (Zone & {
      teams: Team[];
    })[];
  })[];
}

export type {
  RegionDetails,
  TeamDetails,
  ZoneDetails,
} from './entity-details.types';
