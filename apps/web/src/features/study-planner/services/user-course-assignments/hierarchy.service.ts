import { createClient } from '../../../../lib/supabase/server'
import type { TeamCourseAssignment } from '../../types/user-context.types'
import {
  COURSE_INFO_SELECT,
  PERSON_NAME_SELECT,
} from '../course-query.shared'
import { buildTeamAssignment } from './mappers'
import {
  hierarchyAssignmentsTable,
  organizationRegionsTable,
  organizationTeamsTable,
  organizationUsersTable,
  organizationZonesTable,
  regionAssignmentLinksTable,
  teamAssignmentLinksTable,
  workTeamAssignmentsTable,
  workTeamMembersTable,
  zoneAssignmentLinksTable,
} from './tables'
import type {
  HierarchyEntity,
  HierarchyEntityType,
} from './types'

export async function getTeamCourseAssignments(
  userId: string,
): Promise<TeamCourseAssignment[]> {
  const supabase = await createClient()

  const { data: orgUser, error: orgUserError } = await organizationUsersTable(
    supabase,
  )
    .select('organization_id, team_id, zone_id, region_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (orgUserError || !orgUser?.organization_id) {
    return getLegacyTeamCourseAssignments(userId)
  }

  const entity = resolveHierarchyEntity(orgUser)
  if (!entity) {
    return []
  }

  const assignmentIds = await getHierarchyAssignmentIds(supabase, entity.type, entity.id)
  if (assignmentIds.length === 0) {
    return []
  }

  const { data, error } = await hierarchyAssignmentsTable(supabase)
    .select(`
      id,
      organization_id,
      course_id,
      assigned_by,
      assigned_at,
      due_date,
      status,
      message,
      courses:course_id (
        ${COURSE_INFO_SELECT}
      ),
      assigner:assigned_by (
        ${PERSON_NAME_SELECT}
      )
    `)
    .eq('organization_id', orgUser.organization_id)
    .in('id', assignmentIds)
    .in('status', ['active'])

  if (error) {
    console.error('Error obteniendo asignaciones jerarquicas:', error)
    return getLegacyTeamCourseAssignments(userId)
  }

  const entityName = await getHierarchyEntityName(supabase, entity.type, entity.id)

  return (data ?? [])
    .map((item) => buildTeamAssignment(item, entity.id, entityName))
    .filter((assignment): assignment is TeamCourseAssignment => Boolean(assignment))
}

function resolveHierarchyEntity(value: {
  team_id: string | null
  zone_id: string | null
  region_id: string | null
}): HierarchyEntity | null {
  if (value.team_id != null) {
    return { type: 'team', id: value.team_id }
  }

  if (value.zone_id != null) {
    return { type: 'zone', id: value.zone_id }
  }

  return value.region_id != null ? { type: 'region', id: value.region_id } : null
}

async function getHierarchyAssignmentIds(
  supabase: unknown,
  entityType: HierarchyEntityType,
  entityId: string,
): Promise<string[]> {
  const query =
    entityType === 'team'
      ? teamAssignmentLinksTable(supabase).select('hierarchy_assignment_id').eq('team_id', entityId)
      : entityType === 'zone'
        ? zoneAssignmentLinksTable(supabase).select('hierarchy_assignment_id').eq('zone_id', entityId)
        : regionAssignmentLinksTable(supabase).select('hierarchy_assignment_id').eq('region_id', entityId)

  const { data } = await query

  return (data ?? [])
    .map((item) => item.hierarchy_assignment_id)
    .filter((assignmentId): assignmentId is string => Boolean(assignmentId))
}

async function getHierarchyEntityName(
  supabase: unknown,
  entityType: HierarchyEntityType,
  entityId: string,
): Promise<string> {
  const query =
    entityType === 'team'
      ? organizationTeamsTable(supabase).select('name').eq('id', entityId).single()
      : entityType === 'zone'
        ? organizationZonesTable(supabase).select('name').eq('id', entityId).single()
        : organizationRegionsTable(supabase).select('name').eq('id', entityId).single()

  const { data } = await query

  if (data?.name) {
    return data.name
  }

  switch (entityType) {
    case 'team':
      return 'Equipo'
    case 'zone':
      return 'Zona'
    default:
      return 'Region'
  }
}

async function getLegacyTeamCourseAssignments(
  userId: string,
): Promise<TeamCourseAssignment[]> {
  const supabase = await createClient()

  const { data: teams, error: teamsError } = await workTeamMembersTable(supabase)
    .select('team_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (teamsError || !teams || teams.length === 0) {
    return []
  }

  const teamIds = Array.from(new Set(teams.map((team) => team.team_id)))

  const { data, error } = await workTeamAssignmentsTable(supabase)
    .select(`
      id,
      team_id,
      course_id,
      assigned_by,
      assigned_at,
      due_date,
      status,
      message,
      work_teams:team_id (
        name
      ),
      courses:course_id (
        ${COURSE_INFO_SELECT}
      ),
      assigner:assigned_by (
        ${PERSON_NAME_SELECT}
      )
    `)
    .in('team_id', teamIds)
    .neq('status', 'completed')

  if (error) {
    console.error('Error obteniendo asignaciones de equipos legacy:', error)
    return []
  }

  return (data ?? [])
    .map((item) =>
      buildTeamAssignment(item, item.team_id, item.work_teams?.name ?? 'Equipo'),
    )
    .filter((assignment): assignment is TeamCourseAssignment => Boolean(assignment))
}
