import type { CourseRow, PersonNameRow } from '../course-query.shared'

export type HierarchyEntityType = 'team' | 'zone' | 'region'

export interface OrganizationAssignmentRow {
  id: string
  organization_id: string
  user_id: string
  course_id: string
  assigned_by: string | null
  assigned_at: string
  due_date: string | null
  status: string | null
  completion_percentage: number | null
  completed_at: string | null
  message: string | null
  courses?: CourseRow | null
  assigner?: PersonNameRow | null
  organization?: { name: string | null } | null
}

export interface OrganizationUserHierarchyRow {
  organization_id: string | null
  team_id: string | null
  zone_id: string | null
  region_id: string | null
}

export interface HierarchyAssignmentIdRow {
  hierarchy_assignment_id: string
}

export interface HierarchyAssignmentRow {
  id: string
  organization_id: string | null
  course_id: string
  assigned_by: string | null
  assigned_at: string
  due_date: string | null
  status: string | null
  message: string | null
  courses?: CourseRow | null
  assigner?: PersonNameRow | null
  organization?: { name: string | null } | null
}

export interface NamedEntityRow {
  name: string | null
}

export interface WorkTeamMemberRow {
  team_id: string
}

export interface LegacyTeamAssignmentRow {
  id: string
  team_id: string
  course_id: string
  assigned_by: string | null
  assigned_at: string
  due_date: string | null
  status: string | null
  message: string | null
  work_teams?: NamedEntityRow | null
  courses?: CourseRow | null
  assigner?: PersonNameRow | null
}

export interface CoursePurchaseRow {
  purchase_id: string
  user_id: string
  course_id: string
  purchased_at: string
  access_status: string | null
  expires_at: string | null
  courses?: CourseRow | null
}

export interface EnrollmentProgressRow {
  course_id: string
  progress_percentage: number | null
}

export interface HierarchyEntity {
  type: HierarchyEntityType
  id: string
}

export type AssignmentBuilderInput =
  | HierarchyAssignmentRow
  | LegacyTeamAssignmentRow
