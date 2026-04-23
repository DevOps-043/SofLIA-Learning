import { SupabaseClient } from '@supabase/supabase-js'
import { CommunityMemberRow } from './types'

export async function filterProfesionalesMembers(
  supabase: SupabaseClient,
  communityId: string,
  members: CommunityMemberRow[],
) {
  if (members.length === 0) return members

  const memberUserIds = members.map((member) => member.user_id || member.users.id)
  const { data } = await supabase
    .from('community_members')
    .select('user_id')
    .in('user_id', memberUserIds)
    .eq('is_active', true)
    .neq('community_id', communityId)

  const usersWithOtherCommunities = new Set((data ?? []).map((item) => item.user_id))
  return members.filter((member) => !usersWithOtherCommunities.has(member.user_id || member.users.id))
}
