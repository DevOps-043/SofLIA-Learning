import { describe, expect, it } from 'vitest'
import { mapRowToAdminCommunity, type CommunityStatsRow } from '../adminCommunities.types'

describe('adminCommunities.types', () => {
  it('maps view rows into admin community contracts', () => {
    const row: CommunityStatsRow = {
      id: 'community-1',
      name: 'Community One',
      description: 'Description',
      slug: 'community-one',
      image_url: 'https://example.com/image.png',
      member_count: 12,
      is_active: true,
      visibility: 'public',
      access_type: 'open',
      course_id: 'course-1',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      course_id_full: 'course-1',
      course_title: 'Course One',
      course_slug: 'course-one',
      course_thumbnail: 'https://example.com/course.png',
      creator_id: 'user-1',
      creator_username: 'creator',
      creator_email: 'creator@example.com',
      creator_display_name: 'Creator Name',
      creator_first_name: 'Creator',
      creator_last_name: 'Name',
      creator_avatar: 'https://example.com/avatar.png',
      members_count: 12,
      admin_count: 1,
      moderator_count: 2,
      active_members_count: 8,
      posts_count: 5,
      pinned_posts_count: 1,
      total_posts_likes: 20,
      total_posts_views: 100,
      comments_count: 9,
      active_comments_count: 7,
      videos_count: 3,
      active_videos_count: 2,
      pending_requests_count: 4,
      approved_requests_count: 6,
      rejected_requests_count: 1,
      total_reactions_count: 11
    }

    const community = mapRowToAdminCommunity(row)

    expect(community.course?.title).toBe('Course One')
    expect(community.creator?.display_name).toBe('Creator Name')
    expect(community.stats?.pending_requests_count).toBe(4)
    expect(community.access_requests_count).toBe(4)
  })
})
