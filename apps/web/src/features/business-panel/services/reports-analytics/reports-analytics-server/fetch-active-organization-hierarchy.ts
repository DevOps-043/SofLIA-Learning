import { fetchPagedRows } from './fetch-paged-rows'
import { selectActiveOrganizationStructure } from './select-active-organization-structure'
import type {
  ActiveOrganizationHierarchy,
  OrganizationNodeMembershipRecord,
  OrganizationNodeRecord,
  OrganizationStructureRecord,
} from './active-organization-hierarchy'
import type { ReportsAnalyticsUntypedSupabaseClient } from './reports-analytics-untyped-supabase-client'

export async function fetchActiveOrganizationHierarchy(
  supabase: ReportsAnalyticsUntypedSupabaseClient,
  organizationId: string,
): Promise<ActiveOrganizationHierarchy | null> {
  const structures = await fetchPagedRows<OrganizationStructureRecord>(
    'organization structures',
    (from, to) =>
      supabase
        .from('organization_structures')
        .select('id, name, is_default')
        .eq('organization_id', organizationId)
        .range(from, to),
  )
  const structure = selectActiveOrganizationStructure(structures)
  if (!structure) return null

  const [nodes, memberships] = await Promise.all([
    fetchPagedRows<OrganizationNodeRecord>('organization nodes', (from, to) =>
      supabase
        .from('organization_nodes')
        .select('id, parent_id, name, type, code, depth')
        .eq('organization_id', organizationId)
        .eq('structure_id', structure.id)
        .range(from, to),
    ),
    fetchPagedRows<OrganizationNodeMembershipRecord>('organization node memberships', (from, to) =>
      supabase
        .from('organization_node_users')
        .select(`
          node_id,
          user_id,
          is_primary,
          created_at,
          organization_nodes!inner (id)
        `)
        .eq('organization_nodes.organization_id', organizationId)
        .eq('organization_nodes.structure_id', structure.id)
        .range(from, to),
    ),
  ])

  return { structure, nodes, memberships }
}
