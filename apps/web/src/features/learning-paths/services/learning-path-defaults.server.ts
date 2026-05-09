import 'server-only'

import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import type { LearningPath } from '@/features/admin/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'

type LearningPathDefaultScopeType = 'organization' | 'node'
type LearningPathDefaultRuleStatus = 'active' | 'revoked'
type LearningPathAssignmentSource = 'manual' | 'bulk' | 'default_rule'

interface LooseRow {
  [key: string]: unknown
}

interface OrganizationUserRow extends LooseRow {
  user_id: string
  status: string | null
}

interface OrganizationNodeRow extends LooseRow {
  id: string
  organization_id: string
  name: string
  type: string
  path: string
  parent_id: string | null
  is_active: boolean | null
}

interface OrganizationNodeUserRow extends LooseRow {
  node_id: string
  user_id: string
}

interface UserLearningPathAssignmentStatusRow extends LooseRow {
  id: string
  status: 'assigned' | 'revoked'
}

interface LearningPathDefaultRuleRow extends LooseRow {
  id: string
  organization_id: string
  learning_path_id: string
  scope_type: LearningPathDefaultScopeType
  node_id: string | null
  include_descendants: boolean
  status: LearningPathDefaultRuleStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LearningPathDefaultRule {
  id: string
  organization_id: string
  learning_path_id: string
  scope_type: LearningPathDefaultScopeType
  node_id: string | null
  include_descendants: boolean
  status: LearningPathDefaultRuleStatus
  created_by: string | null
  created_at: string
  updated_at: string
  learning_path: LearningPath | null
  node: {
    id: string
    name: string
    type: string
    path: string
  } | null
}

export interface LearningPathHierarchyNodeOption {
  id: string
  name: string
  type: string
  path: string
  parent_id: string | null
  depth: number
}

export interface LearningPathTarget {
  type: 'all' | 'node'
  nodeIds?: string[]
  includeDescendants?: boolean
}

export interface LearningPathBulkApplyResult {
  targetUsers: number
  assigned: number
  existing: number
  reactivated: number
  skippedRevoked: number
}

function getNodeDepth(path: string) {
  if (!path || path === 'root') return 0
  return path.split('.').filter(Boolean).length - 1
}

function isMissingDefaultRulesInfrastructureError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string }
  const text = [candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    candidate.code === '42P01' ||
    candidate.code === '42703' ||
    text.includes('organization_learning_path_default_rules') ||
    text.includes('assignment_source') ||
    text.includes('default_rule_id')
  )
}

function throwMissingDefaultRulesMigrationError() {
  throw new Error('Ejecuta la migracion de rutas predeterminadas antes de usar esta funcion')
}

function mapRule(
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
    node: node
      ? {
          id: node.id,
          name: node.name,
          type: node.type,
          path: node.path,
        }
      : null,
  }
}

async function getExistingAssignmentStatus(
  organizationId: string,
  userId: string,
  learningPathId: string,
) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<UserLearningPathAssignmentStatusRow>(
    supabase,
    'user_learning_path_assignments',
  )
    .select('id, status')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('learning_path_id', learningPathId)
    .maybeSingle()

  if (error) {
    logger.error('Error checking learning path assignment status:', error)
    throw new Error('No se pudo validar la asignacion existente')
  }

  return data
}

export class LearningPathDefaultsService {
  static async listHierarchyNodeOptions(
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

  static async listDefaultRules(
    organizationId: string,
  ): Promise<LearningPathDefaultRule[]> {
    const supabase = createAdminClient()
    const { data, error } = await fromLoose<LearningPathDefaultRuleRow>(
      supabase,
      'organization_learning_path_default_rules',
    )
      .select(`
        id,
        organization_id,
        learning_path_id,
        scope_type,
        node_id,
        include_descendants,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error loading learning path default rules:', error)
      if (isMissingDefaultRulesInfrastructureError(error)) {
        return []
      }
      throw new Error('No se pudieron cargar las reglas predeterminadas')
    }

    const rows = data || []
    const [learningPaths, nodes] = await Promise.all([
      AdminLearningPathsService.listLearningPaths(),
      this.listHierarchyNodeOptions(organizationId),
    ])
    const learningPathMap = new Map(learningPaths.map((path) => [path.id, path]))
    const nodeMap = new Map<string, OrganizationNodeRow>(
      nodes.map((node) => [
        node.id,
        {
          id: node.id,
          organization_id: organizationId,
          name: node.name,
          type: node.type,
          path: node.path,
          parent_id: node.parent_id,
          is_active: true,
        },
      ]),
    )

    return rows.map((row) => mapRule(row, learningPathMap, nodeMap))
  }

  static async createOrReactivateDefaultRule(params: {
    organizationId: string
    learningPathId: string
    scopeType: LearningPathDefaultScopeType
    nodeId?: string | null
    includeDescendants?: boolean
    createdBy: string
  }) {
    const {
      organizationId,
      learningPathId,
      scopeType,
      nodeId = null,
      includeDescendants = true,
      createdBy,
    } = params

    const learningPath = await AdminLearningPathsService.getLearningPathById(learningPathId)
    if (!learningPath || !learningPath.is_active) {
      throw new Error('La ruta de aprendizaje no esta disponible')
    }

    if (scopeType === 'node') {
      if (!nodeId) {
        throw new Error('Selecciona un nodo para la regla predeterminada')
      }

      const nodes = await this.listHierarchyNodeOptions(organizationId)
      if (!nodes.some((node) => node.id === nodeId)) {
        throw new Error('El nodo seleccionado no pertenece a la organizacion')
      }
    }

    const supabase = createAdminClient()
    let existingQuery = fromLoose<LearningPathDefaultRuleRow>(
      supabase,
      'organization_learning_path_default_rules',
    )
      .select(`
        id,
        organization_id,
        learning_path_id,
        scope_type,
        node_id,
        include_descendants,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .eq('learning_path_id', learningPathId)
      .eq('scope_type', scopeType)

    existingQuery = scopeType === 'organization'
      ? existingQuery.is('node_id', null)
      : existingQuery.eq('node_id', nodeId)

    const existing = await existingQuery.maybeSingle()
    if (existing.error) {
      logger.error('Error checking default learning path rule:', existing.error)
      if (isMissingDefaultRulesInfrastructureError(existing.error)) {
        throwMissingDefaultRulesMigrationError()
      }
      throw new Error('No se pudo validar la regla predeterminada')
    }

    if (existing.data) {
      const { error } = await fromLoose<LearningPathDefaultRuleRow>(
        supabase,
        'organization_learning_path_default_rules',
      )
        .update({
          status: 'active',
          include_descendants: includeDescendants,
          created_by: createdBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.data.id)

      if (error) {
        logger.error('Error reactivating default learning path rule:', error)
        if (isMissingDefaultRulesInfrastructureError(error)) {
          throwMissingDefaultRulesMigrationError()
        }
        throw new Error('No se pudo activar la regla predeterminada')
      }

      return existing.data.id
    }

    const { data, error } = await fromLoose<LearningPathDefaultRuleRow>(
      supabase,
      'organization_learning_path_default_rules',
    )
      .insert({
        organization_id: organizationId,
        learning_path_id: learningPathId,
        scope_type: scopeType,
        node_id: scopeType === 'node' ? nodeId : null,
        include_descendants: includeDescendants,
        status: 'active',
        created_by: createdBy,
      })
      .select('id')
      .single()

    if (error || !data) {
      logger.error('Error creating default learning path rule:', error)
      if (isMissingDefaultRulesInfrastructureError(error)) {
        throwMissingDefaultRulesMigrationError()
      }
      throw new Error('No se pudo crear la regla predeterminada')
    }

    return data.id
  }

  static async revokeDefaultRule(params: {
    organizationId: string
    ruleId: string
  }) {
    const supabase = createAdminClient()
    const { error } = await fromLoose<LearningPathDefaultRuleRow>(
      supabase,
      'organization_learning_path_default_rules',
    )
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', params.organizationId)
      .eq('id', params.ruleId)

    if (error) {
      logger.error('Error revoking default learning path rule:', error)
      if (isMissingDefaultRulesInfrastructureError(error)) {
        throwMissingDefaultRulesMigrationError()
      }
      throw new Error('No se pudo desactivar la regla predeterminada')
    }
  }

  static async resolveTargetUserIds(
    organizationId: string,
    target: LearningPathTarget,
  ) {
    const supabase = createAdminClient()

    if (target.type === 'all') {
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

    const requestedNodeIds = target.nodeIds || []
    if (requestedNodeIds.length === 0) {
      throw new Error('Selecciona al menos un nodo')
    }

    const { data: allNodes, error: nodesError } = await fromLoose<OrganizationNodeRow>(
      supabase,
      'organization_nodes',
    )
      .select('id, organization_id, name, type, path, parent_id, is_active')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (nodesError) {
      logger.error('Error loading organization nodes for learning path bulk assign:', nodesError)
      throw new Error('No se pudo cargar la estructura de la organizacion')
    }

    const nodeMap = new Map((allNodes || []).map((node) => [node.id, node]))
    const selectedNodes = requestedNodeIds.map((id) => nodeMap.get(id)).filter(Boolean)

    if (selectedNodes.length !== requestedNodeIds.length) {
      throw new Error('Algunos nodos no pertenecen a la organizacion')
    }

    const includeDescendants = target.includeDescendants ?? true
    const targetNodeIds = new Set<string>()

    for (const selectedNode of selectedNodes) {
      if (!selectedNode) continue
      targetNodeIds.add(selectedNode.id)

      if (includeDescendants) {
        for (const node of allNodes || []) {
          if (node.path.startsWith(`${selectedNode.path}.`)) {
            targetNodeIds.add(node.id)
          }
        }
      }
    }

    if (targetNodeIds.size === 0) {
      return []
    }

    const { data: nodeUsers, error: nodeUsersError } =
      await fromLoose<OrganizationNodeUserRow>(supabase, 'organization_node_users')
        .select('node_id, user_id')
        .in('node_id', [...targetNodeIds])

    if (nodeUsersError) {
      logger.error('Error loading node users for learning path bulk assign:', nodeUsersError)
      throw new Error('No se pudieron cargar los usuarios de la estructura')
    }

    const candidateUserIds = [...new Set((nodeUsers || []).map((row) => row.user_id))]
    if (candidateUserIds.length === 0) {
      return []
    }

    const { data: activeUsers, error: activeUsersError } =
      await fromLoose<OrganizationUserRow>(supabase, 'organization_users')
        .select('user_id, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .in('user_id', candidateUserIds)

    if (activeUsersError) {
      logger.error('Error validating active users for learning path target:', activeUsersError)
      throw new Error('No se pudieron validar los usuarios activos')
    }

    return [...new Set((activeUsers || []).map((row) => row.user_id))]
  }

  static async assignLearningPathToUsers(params: {
    organizationId: string
    learningPathId: string
    userIds: string[]
    assignedBy: string | null
    assignmentSource: LearningPathAssignmentSource
    defaultRuleId?: string | null
    reactivateRevoked?: boolean
  }): Promise<LearningPathBulkApplyResult> {
    const uniqueUserIds = [...new Set(params.userIds)]
    const result: LearningPathBulkApplyResult = {
      targetUsers: uniqueUserIds.length,
      assigned: 0,
      existing: 0,
      reactivated: 0,
      skippedRevoked: 0,
    }

    for (const userId of uniqueUserIds) {
      const existing = await getExistingAssignmentStatus(
        params.organizationId,
        userId,
        params.learningPathId,
      )

      if (existing?.status === 'assigned') {
        result.existing += 1
        continue
      }

      if (existing?.status === 'revoked' && params.reactivateRevoked === false) {
        result.skippedRevoked += 1
        continue
      }

      const assignment = await AdminLearningPathsService.assignToUser(
        params.organizationId,
        userId,
        params.learningPathId,
        params.assignedBy || userId,
        {
          assignmentSource: params.assignmentSource,
          defaultRuleId: params.defaultRuleId,
          reactivateRevoked: params.reactivateRevoked,
        },
      )

      if (assignment.status === 'assigned' && existing?.status === 'revoked') {
        result.reactivated += 1
      } else if (assignment.status === 'assigned') {
        result.assigned += 1
      }
    }

    return result
  }

  static async assignLearningPathToTarget(params: {
    organizationId: string
    learningPathId: string
    target: LearningPathTarget
    assignedBy: string
  }) {
    const userIds = await this.resolveTargetUserIds(params.organizationId, params.target)
    return this.assignLearningPathToUsers({
      organizationId: params.organizationId,
      learningPathId: params.learningPathId,
      userIds,
      assignedBy: params.assignedBy,
      assignmentSource: 'bulk',
      reactivateRevoked: true,
    })
  }

  static async applyDefaultRules(params: {
    organizationId: string
    ruleIds?: string[]
    appliedBy?: string | null
  }) {
    const rules = (await this.listDefaultRules(params.organizationId)).filter(
      (rule) =>
        rule.status === 'active' &&
        (!params.ruleIds || params.ruleIds.includes(rule.id)) &&
        rule.learning_path?.is_active !== false,
    )

    const aggregate = {
      rulesApplied: rules.length,
      targetUsers: 0,
      assigned: 0,
      existing: 0,
      reactivated: 0,
      skippedRevoked: 0,
    }

    for (const rule of rules) {
      const userIds = await this.resolveTargetUserIds(rule.organization_id, {
        type: rule.scope_type === 'organization' ? 'all' : 'node',
        nodeIds: rule.node_id ? [rule.node_id] : [],
        includeDescendants: rule.include_descendants,
      })

      const result = await this.assignLearningPathToUsers({
        organizationId: rule.organization_id,
        learningPathId: rule.learning_path_id,
        userIds,
        assignedBy: rule.created_by || params.appliedBy || null,
        assignmentSource: 'default_rule',
        defaultRuleId: rule.id,
        reactivateRevoked: false,
      })

      aggregate.targetUsers += result.targetUsers
      aggregate.assigned += result.assigned
      aggregate.existing += result.existing
      aggregate.reactivated += result.reactivated
      aggregate.skippedRevoked += result.skippedRevoked
    }

    return aggregate
  }

  static async applyDefaultRulesForUser(params: {
    organizationId: string
    userId: string
  }) {
    const supabase = createAdminClient()
    const { data: membership, error: membershipError } =
      await fromLoose<OrganizationUserRow>(supabase, 'organization_users')
        .select('user_id, status')
        .eq('organization_id', params.organizationId)
        .eq('user_id', params.userId)
        .eq('status', 'active')
        .maybeSingle()

    if (membershipError || !membership) {
      if (membershipError) {
        logger.error('Error validating membership for default learning paths:', membershipError)
      }
      return {
        rulesApplied: 0,
        targetUsers: 0,
        assigned: 0,
        existing: 0,
        reactivated: 0,
        skippedRevoked: 0,
      }
    }

    const activeRules = (await this.listDefaultRules(params.organizationId)).filter(
      (rule) => rule.status === 'active' && rule.learning_path?.is_active !== false,
    )
    if (activeRules.length === 0) {
      return {
        rulesApplied: 0,
        targetUsers: 0,
        assigned: 0,
        existing: 0,
        reactivated: 0,
        skippedRevoked: 0,
      }
    }

    const { data: memberships } = await fromLoose<OrganizationNodeUserRow>(
      supabase,
      'organization_node_users',
    )
      .select('node_id, user_id')
      .eq('user_id', params.userId)

    const userNodeIds = new Set((memberships || []).map((row) => row.node_id))
    const userNodes = (await this.listHierarchyNodeOptions(params.organizationId)).filter((node) =>
      userNodeIds.has(node.id),
    )

    const applicableRules = activeRules.filter((rule) => {
      if (rule.scope_type === 'organization') {
        return true
      }

      if (!rule.node_id || !rule.node) {
        return false
      }

      if (userNodeIds.has(rule.node_id)) {
        return true
      }

      return rule.include_descendants
        ? userNodes.some((node) => node.path.startsWith(`${rule.node?.path}.`))
        : false
    })

    const aggregate = {
      rulesApplied: applicableRules.length,
      targetUsers: applicableRules.length > 0 ? 1 : 0,
      assigned: 0,
      existing: 0,
      reactivated: 0,
      skippedRevoked: 0,
    }

    for (const rule of applicableRules) {
      const result = await this.assignLearningPathToUsers({
        organizationId: params.organizationId,
        learningPathId: rule.learning_path_id,
        userIds: [params.userId],
        assignedBy: rule.created_by || params.userId,
        assignmentSource: 'default_rule',
        defaultRuleId: rule.id,
        reactivateRevoked: false,
      })

      aggregate.assigned += result.assigned
      aggregate.existing += result.existing
      aggregate.reactivated += result.reactivated
      aggregate.skippedRevoked += result.skippedRevoked
    }

    return aggregate
  }
}
