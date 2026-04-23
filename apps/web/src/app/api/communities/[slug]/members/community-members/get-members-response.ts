import { SupabaseClient } from '@supabase/supabase-js'
import { PROFESIONALES_COMMUNITY_SLUG } from '../../../community-policy.constants'
import { buildEmptyMembersResponse } from './empty-response'
import { getMemberStatsMaps } from './member-stats'
import { buildRankedMembers } from './member-transform'
import { getCommunityBySlug } from './community'
import { loadCommunityMembers } from './member-loaders'
import { filterProfesionalesMembers } from './professionals-filter'
import { ApiRouteResult } from './types'

export async function getCommunityMembersPayload(
  supabase: SupabaseClient,
  slug: string,
): Promise<ApiRouteResult> {
  const community = await getCommunityBySlug(supabase, slug)
  if (!community) return { status: 404, body: { error: 'Comunidad no encontrada' } }

  let members = await loadCommunityMembers(supabase, community.id)
  if (community.slug === PROFESIONALES_COMMUNITY_SLUG) {
    members = await filterProfesionalesMembers(supabase, community.id, members)
  }

  if (members.length === 0) return { status: 200, body: buildEmptyMembersResponse(community) }

  const memberUserIds = members.map((member) => member.user_id || member.users.id)
  const statsMaps = await getMemberStatsMaps(supabase, community.id, memberUserIds)
  const rankedMembers = buildRankedMembers(members, statsMaps)

  return {
    status: 200,
    body: { community: { ...community }, members: rankedMembers, total: rankedMembers.length },
  }
}
