import type { DeleteTableConfig } from './delete-user.config'

export const USER_REQUIRED_INSTRUCTOR_REFERENCE_TABLES = [
  'course_lessons',
  'course_lessons_en',
  'course_lessons_pt',
] as const

export const USER_NULL_UPDATE_TABLES: DeleteTableConfig[] = [
  { tableName: 'reportes_problemas', column: 'admin_asignado' },
  { tableName: 'organization_nodes', column: 'manager_id' },
  { tableName: 'organization_users', column: 'invited_by' },
  { tableName: 'courses', column: 'instructor_id' },
  { tableName: 'courses', column: 'approved_by' },
  { tableName: 'content_translations', column: 'created_by' },
  { tableName: 'scorm_packages', column: 'created_by' },
  { tableName: 'organization_regions', column: 'created_by' },
  { tableName: 'organization_regions', column: 'manager_id' },
  { tableName: 'organization_teams', column: 'created_by' },
  { tableName: 'organization_teams', column: 'leader_id' },
  { tableName: 'organization_zones', column: 'created_by' },
  { tableName: 'organization_zones', column: 'manager_id' },
  { tableName: 'organization_join_requests', column: 'reviewed_by' },
  { tableName: 'community_access_requests', column: 'reviewed_by' },
]
