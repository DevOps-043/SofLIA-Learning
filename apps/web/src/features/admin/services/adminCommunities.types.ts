// Shared types and interfaces for the admin communities services

export interface AdminCommunity {
  id: string
  name: string
  description: string
  slug: string
  image_url?: string
  member_count: number
  is_active: boolean
  visibility: string
  access_type: string
  course_id?: string
  course?: {
    id: string
    title: string
    slug: string
    thumbnail_url?: string
  }
  created_at: string
  updated_at: string
  creator?: {
    id: string
    username: string
    email: string
    display_name?: string
    avatar?: string
  }
  creator_name?: string
  stats?: {
    members_count: number
    admin_count: number
    moderator_count: number
    active_members_count: number
    posts_count: number
    pinned_posts_count: number
    total_posts_likes: number
    total_posts_views: number
    comments_count: number
    active_comments_count: number
    videos_count: number
    active_videos_count: number
    pending_requests_count: number
    approved_requests_count: number
    rejected_requests_count: number
    total_reactions_count: number
  }
  // Campos legacy para compatibilidad
  posts_count?: number
  comments_count?: number
  videos_count?: number
  access_requests_count?: number
}

export interface CommunityStats {
  totalCommunities: number
  activeCommunities: number
  totalMembers: number
  totalPosts: number
  totalComments: number
  totalVideos: number
  totalAccessRequests: number
}

// Interfaces para paginacion
export interface PaginationParams {
  limit?: number
  cursor?: string
  search?: string
  visibility?: string
  isActive?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  total?: number
  page?: number
}

export interface CommunityStatsRow {
  id: string
  name: string
  description: string
  slug: string
  image_url?: string | null
  member_count?: number | null
  is_active: boolean
  visibility: string
  access_type: string
  course_id?: string | null
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

export interface CommunityRow {
  id: string
  name: string
  description: string
  slug: string
  image_url?: string | null
  member_count?: number | null
  is_active: boolean
  visibility: string
  access_type: string
  course_id?: string | null
  created_at: string
  updated_at: string
}

export interface CommunityUserRow {
  id: string
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  profile_picture_url?: string | null
  cargo_rol?: string | null
}

export interface CommunityMemberRow {
  id: string
  user_id: string
  role: string
  joined_at: string
  is_active?: boolean | null
  updated_at?: string | null
}

export interface CommunityAccessRequestRow {
  id: string
  status: string
  note?: string | null
  created_at: string
  reviewed_at?: string | null
  requester_id: string
  reviewed_by?: string | null
}

export function mapRowToAdminCommunity(row: CommunityStatsRow): AdminCommunity {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    image_url: row.image_url || undefined,
    member_count: row.member_count || 0,
    is_active: row.is_active,
    visibility: row.visibility,
    access_type: row.access_type,
    course_id: row.course_id || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    course: row.course_id_full ? {
      id: row.course_id_full,
      title: row.course_title || '',
      slug: row.course_slug || '',
      thumbnail_url: row.course_thumbnail || undefined
    } : undefined,
    creator: row.creator_id ? {
      id: row.creator_id,
      username: row.creator_username || '',
      email: row.creator_email || '',
      display_name: row.creator_display_name ||
        `${row.creator_first_name || ''} ${row.creator_last_name || ''}`.trim() ||
        undefined,
      avatar: row.creator_avatar || undefined
    } : undefined,
    creator_name: row.creator_display_name ||
      `${row.creator_first_name || ''} ${row.creator_last_name || ''}`.trim() ||
      'Sin creador',
    stats: {
      members_count: row.members_count || 0,
      admin_count: row.admin_count || 0,
      moderator_count: row.moderator_count || 0,
      active_members_count: row.active_members_count || 0,
      posts_count: row.posts_count || 0,
      pinned_posts_count: row.pinned_posts_count || 0,
      total_posts_likes: row.total_posts_likes || 0,
      total_posts_views: row.total_posts_views || 0,
      comments_count: row.comments_count || 0,
      active_comments_count: row.active_comments_count || 0,
      videos_count: row.videos_count || 0,
      active_videos_count: row.active_videos_count || 0,
      pending_requests_count: row.pending_requests_count || 0,
      approved_requests_count: row.approved_requests_count || 0,
      rejected_requests_count: row.rejected_requests_count || 0,
      total_reactions_count: row.total_reactions_count || 0
    },
    posts_count: row.posts_count || 0,
    comments_count: row.comments_count || 0,
    videos_count: row.videos_count || 0,
    access_requests_count: row.pending_requests_count || 0
  }
}
