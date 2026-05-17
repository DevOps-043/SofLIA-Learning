import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPathTarget, OrganizationNodeRow, OrganizationNodeUserRow, OrganizationUserRow } from './types'

export async function resolveTargetUserIds(organizationId: string, target: LearningPathTarget) {
  const supabase = createAdminClient()
  if (target.type === 'all') return resolveAllActiveUserIds(organizationId)

  const requestedNodeIds = target.nodeIds || []
  if (requestedNodeIds.length === 0) throw new Error('Selecciona al menos un nodo')

  const allNodes = await loadActiveNodes(organizationId)
  const targetNodeIds = resolveTargetNodeIds(allNodes, requestedNodeIds, target.includeDescendants ?? true)
  if (targetNodeIds.size === 0) return []

  const candidateUserIds = await loadNodeUserIds([...targetNodeIds])
  if (candidateUserIds.length === 0) return []
  return filterActiveOrganizationUserIds(organizationId, candidateUserIds)
}

async function resolveAllActiveUserIds(organizationId: string) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<OrganizationUserRow>(supabase, 'organization_users')
    .select('user_id, status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (error) {
    logger.error('Error loading organization users for learning path bulk assign:', error)
    throw new Error('No se pudieron cargar los usuarios de la organizacion')
  }
  return [...new Set((data || []).map((row) => row.user_id))]
}

async function loadActiveNodes(organizationId: string) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<OrganizationNodeRow>(supabase, 'organization_nodes')
    .select('id, organization_id, name, type, path, parent_id, is_active')
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  if (error) {
    logger.error('Error loading organization nodes for learning path bulk assign:', error)
    throw new Error('No se pudo cargar la estructura de la organizacion')
  }
  return data || []
}

function resolveTargetNodeIds(allNodes: OrganizationNodeRow[], requestedNodeIds: string[], includeDescendants: boolean) {
  const nodeMap = new Map(allNodes.map((node) => [node.id, node]))
  const selectedNodes = requestedNodeIds.map((id) => nodeMap.get(id)).filter(Boolean)
  if (selectedNodes.length !== requestedNodeIds.length) throw new Error('Algunos nodos no pertenecen a la organizacion')

  const targetNodeIds = new Set<string>()
  selectedNodes.forEach((selectedNode) => {
    if (!selectedNode) return
    targetNodeIds.add(selectedNode.id)
    if (includeDescendants) allNodes.filter((node) => node.path.startsWith(selectedNode.path + '.')).forEach((node) => targetNodeIds.add(node.id))
  })
  return targetNodeIds
}

async function loadNodeUserIds(nodeIds: string[]) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<OrganizationNodeUserRow>(supabase, 'organization_node_users')
    .select('node_id, user_id')
    .in('node_id', nodeIds)

  if (error) {
    logger.error('Error loading node users for learning path bulk assign:', error)
    throw new Error('No se pudieron cargar los usuarios de la estructura')
  }
  return [...new Set((data || []).map((row) => row.user_id))]
}

async function filterActiveOrganizationUserIds(organizationId: string, userIds: string[]) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<OrganizationUserRow>(supabase, 'organization_users')
    .select('user_id, status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .in('user_id', userIds)

  if (error) {
    logger.error('Error validating active users for learning path target:', error)
    throw new Error('No se pudieron validar los usuarios activos')
  }
  return [...new Set((data || []).map((row) => row.user_id))]
}
