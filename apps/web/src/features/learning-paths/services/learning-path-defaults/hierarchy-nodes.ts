import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { getNodeDepth } from './mappers'
import type { LearningPathHierarchyNodeOption, OrganizationNodeRow } from './types'

export async function listHierarchyNodeOptions(
  organizationId: string,
): Promise<LearningPathHierarchyNodeOption[]> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<OrganizationNodeRow>(supabase, 'organization_nodes')
    .select('id, organization_id, name, type, path, parent_id, is_active')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('path', { ascending: true })

  if (error) {
    logger.error('Error loading hierarchy nodes for learning path defaults:', error)
    return []
  }

  return (data || []).map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    path: node.path,
    parent_id: node.parent_id,
    depth: getNodeDepth(node.path),
  }))
}
