import type {
  ActiveOrganizationHierarchy,
  AnalyticsHierarchyData,
  OrganizationNodeMembershipRecord,
  OrganizationNodeRecord,
} from './active-organization-hierarchy'
import type { OrganizationUserRecord } from './organization-user-record'

type SemanticNodeType = 'region' | 'zone' | 'team'

interface ResolvedMembership {
  membership: OrganizationNodeMembershipRecord
  node: OrganizationNodeRecord
  region: OrganizationNodeRecord | null
  zone: OrganizationNodeRecord | null
  team: OrganizationNodeRecord | null
}

function normalizedNodeType(node: OrganizationNodeRecord): string {
  return node.type.trim().toLowerCase()
}

function findNearestNodeOfType(
  start: OrganizationNodeRecord | null,
  type: SemanticNodeType,
  nodesById: Map<string, OrganizationNodeRecord>,
): OrganizationNodeRecord | null {
  const visited = new Set<string>()
  let current = start

  while (current && !visited.has(current.id)) {
    if (normalizedNodeType(current) === type) return current
    visited.add(current.id)
    current = current.parent_id ? nodesById.get(current.parent_id) || null : null
  }

  return null
}

function resolveMembership(
  membership: OrganizationNodeMembershipRecord,
  nodesById: Map<string, OrganizationNodeRecord>,
): ResolvedMembership | null {
  const node = nodesById.get(membership.node_id)
  if (!node) return null

  const resolved = {
    membership,
    node,
    region: findNearestNodeOfType(node, 'region', nodesById),
    zone: findNearestNodeOfType(node, 'zone', nodesById),
    team: findNearestNodeOfType(node, 'team', nodesById),
  }

  return resolved.region || resolved.zone || resolved.team ? resolved : null
}

function membershipSpecificity(resolved: ResolvedMembership): number {
  if (resolved.team) return 3
  if (resolved.zone) return 2
  if (resolved.region) return 1
  return 0
}

function compareMembershipPriority(left: ResolvedMembership, right: ResolvedMembership): number {
  const primaryDifference =
    Number(Boolean(right.membership.is_primary)) - Number(Boolean(left.membership.is_primary))
  if (primaryDifference !== 0) return primaryDifference

  const specificityDifference = membershipSpecificity(right) - membershipSpecificity(left)
  if (specificityDifference !== 0) return specificityDifference

  const depthDifference = (right.node.depth || 0) - (left.node.depth || 0)
  if (depthDifference !== 0) return depthDifference

  const dateDifference = (right.membership.created_at || '').localeCompare(
    left.membership.created_at || '',
  )
  return dateDifference !== 0
    ? dateDifference
    : left.membership.node_id.localeCompare(right.membership.node_id)
}

function semanticParent(
  node: OrganizationNodeRecord,
  type: SemanticNodeType,
  nodesById: Map<string, OrganizationNodeRecord>,
): OrganizationNodeRecord | null {
  const parent = node.parent_id ? nodesById.get(node.parent_id) || null : null
  return findNearestNodeOfType(parent, type, nodesById)
}

/**
 * Converts the dynamic hierarchy into the fixed region/zone/team dimensions
 * consumed by analytics. Legacy IDs are always overwritten whenever a dynamic
 * structure exists, so deleted entities cannot leak back into reports.
 */
export function mapActiveHierarchyToAnalytics(
  organizationUsers: OrganizationUserRecord[],
  hierarchy: ActiveOrganizationHierarchy,
): AnalyticsHierarchyData {
  const nodesById = new Map(hierarchy.nodes.map((node) => [node.id, node]))
  const regions = hierarchy.nodes
    .filter((node) => normalizedNodeType(node) === 'region')
    .map((node) => ({ id: node.id, name: node.name, code: node.code, is_active: true }))
  const zones = hierarchy.nodes
    .filter((node) => normalizedNodeType(node) === 'zone')
    .map((node) => ({
      id: node.id,
      name: node.name,
      code: node.code,
      region_id: semanticParent(node, 'region', nodesById)?.id || null,
      is_active: true,
    }))
  const teams = hierarchy.nodes
    .filter((node) => normalizedNodeType(node) === 'team')
    .map((node) => ({
      id: node.id,
      name: node.name,
      code: node.code,
      zone_id: semanticParent(node, 'zone', nodesById)?.id || null,
      is_active: true,
    }))

  const membershipsByUser = new Map<string, ResolvedMembership[]>()
  hierarchy.memberships.forEach((membership) => {
    const resolved = resolveMembership(membership, nodesById)
    if (!resolved) return
    const current = membershipsByUser.get(membership.user_id) || []
    current.push(resolved)
    membershipsByUser.set(membership.user_id, current)
  })

  const scopedUsers = organizationUsers.map((record) => {
    const resolved = (membershipsByUser.get(record.user_id) || [])
      .sort(compareMembershipPriority)[0]

    return {
      ...record,
      region_id: resolved?.region?.id || null,
      zone_id: resolved?.zone?.id || null,
      team_id: resolved?.team?.id || null,
      hierarchy_scope: resolved?.team
        ? 'team'
        : resolved?.zone
          ? 'zone'
          : resolved?.region
            ? 'region'
            : null,
    }
  })

  return { organizationUsers: scopedUsers, regions, zones, teams }
}
