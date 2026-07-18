import type { LearningPath } from '@/features/admin/types'
import type { LearningPathDefaultRule, LearningPathDefaultRuleRow, OrganizationNodeRow } from './types'

export function getNodeDepth(path: string) {
  if (!path || path === 'root') return 0
  return path.split('.').filter(Boolean).length - 1
}

export function mapRule(
  row: LearningPathDefaultRuleRow,
  learningPathMap: Map<string, LearningPath>,
  nodeMap: Map<string, OrganizationNodeRow>,
): LearningPathDefaultRule {
  const node = row.node_id ? nodeMap.get(row.node_id) || null : null

  return {
    id: row.id,
    organization_id: row.organization_id,
    learning_path_id: row.learning_path_id,
    scope_type: row.scope_type,
    node_id: row.node_id,
    include_descendants: row.include_descendants,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    learning_path: learningPathMap.get(row.learning_path_id) || null,
    node: node ? { id: node.id, name: node.name, type: node.type, path: node.path } : null,
  }
}

export const mapDefaultRule = mapRule

export function optionToNodeRow(node: { id: string; name: string; type: string; path: string; parent_id: string | null }, organizationId: string): OrganizationNodeRow {
  return { id: node.id, organization_id: organizationId, name: node.name, type: node.type, path: node.path, parent_id: node.parent_id }
}
