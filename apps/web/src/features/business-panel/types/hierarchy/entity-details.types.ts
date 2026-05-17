import type { ManagerInfo } from './core.types';
import type { Region, Team, Zone } from './entities.types';

export interface RegionDetails {
  manager: ManagerInfo | null;
  region: Region;
  stats: {
    teams_count: number;
    users_count: number;
    zones_count: number;
  };
}

export interface ZoneDetails {
  manager: ManagerInfo | null;
  region: {
    code?: string | null;
    id: string;
    name: string;
  };
  stats: {
    teams_count: number;
    users_count: number;
  };
  zone: Zone;
}

export interface TeamDetails {
  leader: ManagerInfo | null;
  region: {
    code?: string | null;
    id: string;
    name: string;
  };
  stats: {
    capacity_percentage: number | null;
    members_count: number;
  };
  team: Team;
  zone: {
    code?: string | null;
    id: string;
    name: string;
  };
}
