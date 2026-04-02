import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type {
  CoursePurchaseRow,
  EnrollmentProgressRow,
  HierarchyAssignmentIdRow,
  HierarchyAssignmentRow,
  LegacyTeamAssignmentRow,
  NamedEntityRow,
  OrganizationAssignmentRow,
  OrganizationUserHierarchyRow,
  WorkTeamMemberRow,
} from './types'

export function organizationAssignmentsTable(client: unknown) {
  return fromLoose<OrganizationAssignmentRow>(
    client,
    'organization_course_assignments',
  )
}

export function organizationUsersTable(client: unknown) {
  return fromLoose<OrganizationUserHierarchyRow>(client, 'organization_users')
}

export function hierarchyAssignmentsTable(client: unknown) {
  return fromLoose<HierarchyAssignmentRow>(client, 'hierarchy_course_assignments')
}

export function teamAssignmentLinksTable(client: unknown) {
  return fromLoose<HierarchyAssignmentIdRow>(client, 'team_course_assignments')
}

export function zoneAssignmentLinksTable(client: unknown) {
  return fromLoose<HierarchyAssignmentIdRow>(client, 'zone_course_assignments')
}

export function regionAssignmentLinksTable(client: unknown) {
  return fromLoose<HierarchyAssignmentIdRow>(client, 'region_course_assignments')
}

export function organizationTeamsTable(client: unknown) {
  return fromLoose<NamedEntityRow>(client, 'organization_teams')
}

export function organizationZonesTable(client: unknown) {
  return fromLoose<NamedEntityRow>(client, 'organization_zones')
}

export function organizationRegionsTable(client: unknown) {
  return fromLoose<NamedEntityRow>(client, 'organization_regions')
}

export function workTeamMembersTable(client: unknown) {
  return fromLoose<WorkTeamMemberRow>(client, 'work_team_members')
}

export function workTeamAssignmentsTable(client: unknown) {
  return fromLoose<LegacyTeamAssignmentRow>(client, 'work_team_course_assignments')
}

export function coursePurchasesTable(client: unknown) {
  return fromLoose<CoursePurchaseRow>(client, 'course_purchases')
}

export function enrollmentProgressTable(client: unknown) {
  return fromLoose<EnrollmentProgressRow>(client, 'user_course_enrollments')
}
