import { CommunityMemberResponse, CommunityMemberRow } from './types'

export function buildRankedMembers(
  members: CommunityMemberRow[],
  statsMaps: {
    postsCountMap: Map<string, number>
    commentsCountMap: Map<string, number>
    reactionsGivenMap: Map<string, number>
    reactionsReceivedMap: Map<string, number>
  },
): CommunityMemberResponse[] {
  const membersWithStats = members.map((member) => {
    const userId = member.user_id || member.users.id
    return {
      id: member.id,
      role: member.role,
      joined_at: member.joined_at,
      user: {
        id: member.users.id,
        email: member.users.email,
        first_name: member.users.first_name,
        last_name: member.users.last_name,
        username: member.users.username,
        profile_picture_url: member.users.profile_picture_url,
        linkedin_url: member.users.linkedin_url,
        github_url: member.users.github_url,
        portfolio_url: member.users.website_url,
        bio: member.users.bio,
        location: member.users.location,
        created_at: member.users.created_at,
        profile_visibility: member.users.profile_visibility || 'public',
      },
      stats: {
        posts_count: statsMaps.postsCountMap.get(userId) || 0,
        comments_count: statsMaps.commentsCountMap.get(userId) || 0,
        reactions_given: statsMaps.reactionsGivenMap.get(userId) || 0,
        reactions_received: statsMaps.reactionsReceivedMap.get(userId) || 0,
        points: member.users.points || 0,
      },
    }
  })

  membersWithStats.sort((left, right) => {
    if (right.stats.points !== left.stats.points) return right.stats.points - left.stats.points
    return new Date(left.joined_at).getTime() - new Date(right.joined_at).getTime()
  })

  return membersWithStats.map((member, index) => ({
    ...member,
    rank: index + 1,
    total_members: membersWithStats.length,
  }))
}
