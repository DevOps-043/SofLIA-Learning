import { createClient } from '../../../lib/supabase/server'
import { fromLoose } from '../../../lib/supabase/looseQuery'
import { AdminCommunityAccessRequestsService } from '../../admin/services/adminCommunityAccessRequests.service'
import { AdminCommunityContentService } from '../../admin/services/adminCommunityContent.service'
import { AdminCommunityMembersService } from '../../admin/services/adminCommunityMembers.service'
import type { CommunityPost, CommunityVideo, InstructorCommunityDetailPayload } from '../types/instructor-community-detail.types'
import type { InstructorCommunity } from './instructorCommunities.service'

type CommunityStatsRow = {
  id: string
  name: string
  description: string | null
  slug: string
  image_url: string | null
  member_count: number | null
  is_active: boolean
  visibility: string | null
  access_type: string | null
  course_id: string | null
  created_at: string
  updated_at: string
  course_id_full?: string | null
  course_title?: string | null
  course_slug?: string | null
  course_thumbnail?: string | null
  creator_id?: string | null
  creator_username?: string | null
  creator_email?: string | null
  creator_display_name?: string | null
  creator_first_name?: string | null
  creator_last_name?: string | null
  creator_avatar?: string | null
  members_count?: number | null
  admin_count?: number | null
  moderator_count?: number | null
  active_members_count?: number | null
  posts_count?: number | null
  pinned_posts_count?: number | null
  total_posts_likes?: number | null
  total_posts_views?: number | null
  comments_count?: number | null
  active_comments_count?: number | null
  videos_count?: number | null
  active_videos_count?: number | null
  pending_requests_count?: number | null
  approved_requests_count?: number | null
  rejected_requests_count?: number | null
  total_reactions_count?: number | null
}

function mapCommunityRow(communityRow: CommunityStatsRow): InstructorCommunity {
  const creatorDisplayName =
    communityRow.creator_display_name ||
    `${communityRow.creator_first_name || ''} ${communityRow.creator_last_name || ''}`.trim()

  return {
    id: communityRow.id,
    name: communityRow.name,
    description: communityRow.description || '',
    slug: communityRow.slug,
    image_url: communityRow.image_url || undefined,
    member_count: communityRow.member_count || 0,
    is_active: communityRow.is_active,
    visibility: communityRow.visibility || 'private',
    access_type: communityRow.access_type || 'restricted',
    course_id: communityRow.course_id || undefined,
    created_at: communityRow.created_at,
    updated_at: communityRow.updated_at,
    course: communityRow.course_id_full
      ? {
          id: communityRow.course_id_full,
          title: communityRow.course_title || 'Curso sin titulo',
          slug: communityRow.course_slug || '',
          thumbnail_url: communityRow.course_thumbnail || undefined
        }
      : undefined,
    creator: communityRow.creator_id
      ? {
          id: communityRow.creator_id,
          username: communityRow.creator_username || '',
          email: communityRow.creator_email || '',
          display_name: creatorDisplayName,
          avatar: communityRow.creator_avatar || undefined
        }
      : undefined,
    creator_name: creatorDisplayName || 'Sin creador',
    stats: {
      members_count: communityRow.members_count || 0,
      admin_count: communityRow.admin_count || 0,
      moderator_count: communityRow.moderator_count || 0,
      active_members_count: communityRow.active_members_count || 0,
      posts_count: communityRow.posts_count || 0,
      pinned_posts_count: communityRow.pinned_posts_count || 0,
      total_posts_likes: communityRow.total_posts_likes || 0,
      total_posts_views: communityRow.total_posts_views || 0,
      comments_count: communityRow.comments_count || 0,
      active_comments_count: communityRow.active_comments_count || 0,
      videos_count: communityRow.videos_count || 0,
      active_videos_count: communityRow.active_videos_count || 0,
      pending_requests_count: communityRow.pending_requests_count || 0,
      approved_requests_count: communityRow.approved_requests_count || 0,
      rejected_requests_count: communityRow.rejected_requests_count || 0,
      total_reactions_count: communityRow.total_reactions_count || 0
    },
    posts_count: communityRow.posts_count || 0,
    comments_count: communityRow.comments_count || 0,
    videos_count: communityRow.videos_count || 0,
    access_requests_count: communityRow.pending_requests_count || 0
  }
}

export class InstructorCommunityDetailServerService {
  static async getCommunityDetail(slug: string, instructorId: string): Promise<InstructorCommunityDetailPayload | null> {
    const supabase = await createClient()

    const { data: communityRow, error } = await fromLoose<CommunityStatsRow>(supabase, 'community_stats')
      .select('*')
      .eq('slug', slug)
      .eq('creator_id', instructorId)
      .single()

    if (error || !communityRow) {
      return null
    }

    const community = mapCommunityRow(communityRow)
    const communityId = community.id

    const [posts, members, accessRequests, videos] = await Promise.all([
      AdminCommunityContentService.getCommunityPosts(communityId),
      AdminCommunityMembersService.getCommunityMembers(communityId, 1, 1000),
      AdminCommunityAccessRequestsService.getCommunityAccessRequests(communityId, 1, 1000),
      AdminCommunityContentService.getCommunityVideos(communityId, 1, 1000)
    ])

    return {
      community,
      posts: posts as CommunityPost[],
      members,
      accessRequests,
      videos: videos as CommunityVideo[]
    }
  }
}
