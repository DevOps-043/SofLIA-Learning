import { fromLoose } from '../../../lib/supabase/looseQuery'
import type {
  CommunityAccessRequestRow,
  CommunityMemberRow,
  CommunityRow,
  CommunityStatsRow,
  CommunityUserRow,
} from './adminCommunities.types'

export function communityStatsTable(client: unknown) {
  return fromLoose<CommunityStatsRow>(client, 'community_stats')
}

export function communitiesTable(client: unknown) {
  return fromLoose<CommunityRow>(client, 'communities')
}

export function communityMembersTable(client: unknown) {
  return fromLoose<CommunityMemberRow>(client, 'community_members')
}

export function communityAccessRequestsTable(client: unknown) {
  return fromLoose<CommunityAccessRequestRow>(client, 'community_access_requests')
}

export function communityUsersTable(client: unknown) {
  return fromLoose<CommunityUserRow>(client, 'users')
}

export function communityPostsTable(client: unknown) {
  return fromLoose<{ id: string }>(client, 'community_posts')
}

export function communityCommentsTable(client: unknown) {
  return fromLoose<{ id: string }>(client, 'community_comments')
}

export function communityReactionsTable(client: unknown) {
  return fromLoose<{ id: string }>(client, 'community_reactions')
}

export function communityVideosTable(client: unknown) {
  return fromLoose<{ id: string }>(client, 'community_videos')
}
