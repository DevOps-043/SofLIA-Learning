import { calculateAge, getAgeBand, normalizeDimension, resolveLastConnectionAt } from '../reports-analytics.helpers'
import { unwrapRelation } from './unwrap-relation'
import type { OrganizationRegionRecord } from './organization-region-record'
import type { OrganizationTeamRecord } from './organization-team-record'
import type { OrganizationUserRecord } from './organization-user-record'
import type { OrganizationZoneRecord } from './organization-zone-record'
import type { UserDimension } from './user-dimension'

export function mapUserDimension(
  record: OrganizationUserRecord,
  catalog: {
    regions: Map<string, OrganizationRegionRecord>
    zones: Map<string, OrganizationZoneRecord>
    teams: Map<string, OrganizationTeamRecord>
  },
): UserDimension | null {
  const profile = unwrapRelation(record.users)
  if (!profile) return null

  const age = calculateAge(profile.date_of_birth)
  const team = record.team_id ? catalog.teams.get(record.team_id) || null : null
  const zoneId = record.zone_id || team?.zone_id || null
  const zone = zoneId ? catalog.zones.get(zoneId) || null : null
  const regionId = record.region_id || zone?.region_id || null
  const region = regionId ? catalog.regions.get(regionId) || null : null
  const displayName =
    profile.display_name ||
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
    profile.username ||
    profile.email

  return {
    userId: record.user_id,
    displayName,
    email: profile.email,
    status: normalizeDimension(record.status || 'active'),
    role: normalizeDimension(record.role),
    jobTitle: normalizeDimension(record.job_title),
    gender: normalizeDimension(profile.gender),
    dateOfBirth: profile.date_of_birth || '',
    age,
    ageBand: getAgeBand(age),
    lastConnectionAt: resolveLastConnectionAt(profile.last_login_at, profile.updated_at),
    regionId: normalizeDimension(region?.id || regionId),
    regionName: normalizeDimension(region?.name),
    zoneId: normalizeDimension(zone?.id || zoneId),
    zoneName: normalizeDimension(zone?.name),
    teamId: normalizeDimension(team?.id || record.team_id),
    teamName: normalizeDimension(team?.name),
  }
}
