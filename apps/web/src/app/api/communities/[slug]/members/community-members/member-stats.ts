import { SupabaseClient } from '@supabase/supabase-js'

export async function getMemberStatsMaps(
  supabase: SupabaseClient,
  communityId: string,
  memberUserIds: string[],
) {
  const [postsData, commentsData, reactionsGivenData, reactionsReceivedData] = await Promise.all([
    supabase.from('community_posts').select('user_id').eq('community_id', communityId).in('user_id', memberUserIds),
    supabase.from('community_comments').select('user_id').eq('community_id', communityId).in('user_id', memberUserIds),
    supabase.from('community_reactions').select('user_id').in('user_id', memberUserIds),
    supabase
      .from('community_posts')
      .select('user_id, community_reactions(id)')
      .eq('community_id', communityId)
      .in('user_id', memberUserIds),
  ])

  return {
    postsCountMap: countRowsByUserId(postsData.data),
    commentsCountMap: countRowsByUserId(commentsData.data),
    reactionsGivenMap: countRowsByUserId(reactionsGivenData.data),
    reactionsReceivedMap: countReceivedReactionsByUserId(reactionsReceivedData.data),
  }
}

function countRowsByUserId(rows: Array<{ user_id: string }> | null | undefined) {
  return (rows ?? []).reduce((map, row) => {
    map.set(row.user_id, (map.get(row.user_id) || 0) + 1)
    return map
  }, new Map<string, number>())
}

function countReceivedReactionsByUserId(rows: Record<string, unknown>[] | null | undefined) {
  return (rows ?? []).reduce((map, row) => {
    const userId = String(row.user_id)
    const reactions = Array.isArray(row.community_reactions) ? row.community_reactions.length : 0
    map.set(userId, (map.get(userId) || 0) + reactions)
    return map
  }, new Map<string, number>())
}
