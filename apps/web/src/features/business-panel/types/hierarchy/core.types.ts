export type HierarchyRole =
  | 'owner'
  | 'admin'
  | 'regional_manager'
  | 'zone_manager'
  | 'team_leader'
  | 'node_manager'
  | 'member';

export type HierarchyScope =
  | 'organization'
  | 'region'
  | 'zone'
  | 'team';

export interface LocationInfo {
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  postal_code?: string | null;
  state?: string | null;
}

export interface ContactInfo {
  email?: string | null;
  phone?: string | null;
}

export interface ManagerInfo {
  display_name?: string | null;
  email: string;
  first_name?: string | null;
  id: string;
  last_name?: string | null;
  profile_picture_url?: string | null;
}
