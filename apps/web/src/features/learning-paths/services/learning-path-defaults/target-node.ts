import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { filterActiveUserIds } from './target-active-users'
import type { LearningPathTarget, OrganizationNodeRow, OrganizationNodeUserRow } from './types'

function collectTargetNodeIds(nodes: OrganizationNodeRow[], requestedNodeIds: string[], includeDescendants: boolean) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const selectedNodes = requestedNodeIds
    .map((id) => nodeMap.get(id))
    .filter((node): node is OrganizationNodeRow => Boolean(node))

  if (selectedNodes.length !== requestedNodeIds.length) {
    throw new Error('Algunos nodos no pertenecen a la organizacion')
  }

  const targetNodeIds = new Set<string>()
  selectedNodes.forEach((selectedNode) => {
    targetNodeIds.add(selectedNode.id)
    if (!includeDescendants) return
    nodes.forEach((node) => {
      if (node.path.startsWith(`${selectedNode.path}.`)) targetNodeIds.add(node.id)
    })
  })

  return [...targetNodeIds]
}

async function loadOrganizationNodes(organizationId: string) {
  const { data, error } = await fromLoose<OrganizationNodeRow>(
    createAdminClient(),
    'organization_nodes',
  )
    .select('id, organization_id, name, type, path, parent_id')
    .eq('organization_id', organizationId)

  if (!error) return data || []
  logger.error('Error loading organization nodes for learning path bulk assign:', error)
  throw new Error('No se pudo cargar la estructura de la organizacion')
}

async function loadNodeUserIds(nodeIds: string[]) {
  if (nodeIds.length === 0) return []

  const { data, error } = await fromLoose<OrganizationNodeUserRow>(
    createAdminClient(),
    'organization_node_users',
  )
    .select('node_id, user_id')
    .in('node_id', nodeIds)

  if (!error) return [...new Set((data || []).map((row) => row.user_id))]
  logger.error('Error loading node users for learning path bulk assign:', error)
  throw new Error('No se pudieron cargar los usuarios de la estructura')
}

export async function resolveNodeTargetUserIds(organizationId: string, target: LearningPathTarget) {
  const requestedNodeIds = target.nodeIds || []
  if (requestedNodeIds.length === 0) throw new Error('Selecciona al menos un nodo')

  const allNodes = await loadOrganizationNodes(organizationId)
  const targetNodeIds = collectTargetNodeIds(
    allNodes,
    requestedNodeIds,
    target.includeDescendants ?? true,
  )
  const candidateUserIds = await loadNodeUserIds(targetNodeIds)
  return filterActiveUserIds(organizationId, candidateUserIds)
}
