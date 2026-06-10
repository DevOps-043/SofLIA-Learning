import { fromLoose } from '@/lib/supabase/looseQuery'
import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

interface NodeAssignmentRow {
  id: string
  node_id: string
  organization_nodes: { id: string; name: string; type: string } | null
}

export interface TeamAssignmentResult {
  /** True if the user belongs to a team/node in EITHER hierarchy system. */
  hasTeam: boolean
  /** Best-effort team/node name, when resolvable. */
  teamName?: string
}

/**
 * Single source of truth for "does this user have a team assignment?".
 *
 * Two hierarchy systems coexist on the platform and a user may be assigned in
 * either one:
 *  - "teams" system: `organization_users.team_id` (region/zone/team model,
 *    written by `/hierarchy/users/assign`).
 *  - "nodes" system: `organization_node_users` (generic node tree, written by
 *    `/hierarchy/nodes/[nodeId]/members`).
 *
 * Centralizing the check here prevents the recurring bug of inspecting only one
 * system (which produced false "no team" results for orgs using the other one).
 *
 * @param knownTeamId `organization_users.team_id` when the caller already has it,
 *   to short-circuit and avoid a redundant query. Pass `null`/`undefined` to rely
 *   on the node-based lookup only.
 */
export async function getUserTeamAssignment(
  supabase: SupabaseServerClient,
  userId: string,
  knownTeamId?: string | null,
): Promise<TeamAssignmentResult> {
  // "teams" system: a non-null team_id is a definitive assignment.
  if (knownTeamId) {
    return { hasTeam: true }
  }

  // "nodes" system fallback.
  const { data: nodeAssignment } = await fromLoose<NodeAssignmentRow>(
    supabase,
    'organization_node_users',
  )
    .select(`
      id,
      node_id,
      organization_nodes!inner (
        id,
        name,
        type
      )
    `)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (!nodeAssignment) {
    return { hasTeam: false }
  }

  return {
    hasTeam: true,
    teamName: nodeAssignment.organization_nodes?.name || undefined,
  }
}
