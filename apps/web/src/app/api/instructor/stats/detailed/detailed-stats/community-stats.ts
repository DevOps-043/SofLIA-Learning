import { getDayKey } from './date-range'
import { groupBy, incrementDateActivity } from './map-utils'
import type { DateActivityMap, SupabaseServerClient } from './shared-types'

function createCommunityStats(totalCommunities: number) {
  return {
    totalCommunities,
    totalMembers: 0,
    totalPosts: 0,
    totalComments: 0,
    membersByCommunity: [] as Array<{ communityId: string; communityName: string; memberCount: number }>,
    postsByCommunity: [] as Array<{ communityId: string; communityName: string; postCount: number }>,
    commentsByCommunity: [] as Array<{ communityId: string; communityName: string; commentCount: number }>,
    activityByCommunity: [] as Array<{ communityId: string; communityName: string; activityScore: number }>,
    pointsByCommunity: [] as Array<{ communityId: string; communityName: string; totalPoints: number }>,
    activityByDate: {} as DateActivityMap,
  }
}

export async function getCommunityStats(
  supabase: SupabaseServerClient,
  instructorId: string,
  communityIds: string[],
  startDate: Date,
  endDate: Date,
) {
  const stats = createCommunityStats(communityIds.length)
  if (!communityIds.length) return stats

  const startIso = startDate.toISOString()
  const endIso = endDate.toISOString()
  const [{ data: communities }, { data: members }, { data: posts }, { data: comments }] = await Promise.all([
    supabase.from('communities').select('id, name, member_count').eq('creator_id', instructorId).gte('created_at', startIso).lte('created_at', endIso),
    supabase.from('community_members').select('community_id').in('community_id', communityIds).gte('joined_at', startIso).lte('joined_at', endIso),
    supabase.from('community_posts').select('community_id, created_at, likes_count, comments_count').in('community_id', communityIds).gte('created_at', startIso).lte('created_at', endIso),
    supabase.from('community_comments').select('community_id, created_at').in('community_id', communityIds).gte('created_at', startIso).lte('created_at', endIso),
  ])

  const communityList = communities ?? []
  const postGroups = groupBy(posts ?? [], (row) => row.community_id)
  const commentGroups = groupBy(comments ?? [], (row) => row.community_id)

  communityList.forEach((community) => {
    const communityPosts = postGroups.get(community.id) ?? []
    const communityComments = commentGroups.get(community.id) ?? []
    stats.totalMembers += community.member_count || 0
    stats.totalPosts += communityPosts.length
    stats.totalComments += communityComments.length
    stats.membersByCommunity.push({ communityId: community.id, communityName: community.name, memberCount: community.member_count || 0 })
    stats.postsByCommunity.push({ communityId: community.id, communityName: community.name, postCount: communityPosts.length })
    stats.commentsByCommunity.push({ communityId: community.id, communityName: community.name, commentCount: communityComments.length })
    stats.activityByCommunity.push({ communityId: community.id, communityName: community.name, activityScore: communityPosts.length * 2 + communityComments.length })
    stats.pointsByCommunity.push({ communityId: community.id, communityName: community.name, totalPoints: communityPosts.reduce((sum, row) => sum + ((row.likes_count || 0) + (row.comments_count || 0)), 0) })
  })

  ;(posts ?? []).forEach((post) => incrementDateActivity(stats.activityByDate, getDayKey(post.created_at), 'posts'))
  ;(comments ?? []).forEach((comment) => incrementDateActivity(stats.activityByDate, getDayKey(comment.created_at), 'comments'))
  return stats
}
