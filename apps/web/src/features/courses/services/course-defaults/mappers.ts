import type { CourseDefaultRule, CourseDefaultRuleRow, CourseReference, OrganizationNodeRow } from './types'

export function mapCourseDefaultRule(
  row: CourseDefaultRuleRow,
  courseMap: Map<string, CourseReference>,
  nodeMap: Map<string, OrganizationNodeRow>,
): CourseDefaultRule {
  const node = row.node_id ? nodeMap.get(row.node_id) || null : null

  return {
    id: row.id,
    organization_id: row.organization_id,
    course_id: row.course_id,
    scope_type: row.scope_type,
    node_id: row.node_id,
    include_descendants: row.include_descendants,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    course: courseMap.get(row.course_id) || null,
    node: node ? { id: node.id, name: node.name, type: node.type, path: node.path } : null,
  }
}
