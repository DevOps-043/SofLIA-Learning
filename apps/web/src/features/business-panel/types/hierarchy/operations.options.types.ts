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
