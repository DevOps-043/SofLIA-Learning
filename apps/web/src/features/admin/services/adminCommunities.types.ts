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

// ✅ ISSUE #19: Interfaces para paginación
export interface PaginationParams {
  limit?: number        // Cuántos items por página (default: 20)
  cursor?: string       // ID de la última comunidad vista
  search?: string       // Búsqueda por nombre o descripción
  visibility?: string   // Filtro por visibilidad (public, private)
  isActive?: boolean    // Filtro por estado activo
}

export interface PaginatedResponse<T> {
  data: T[]                    // Items de la página actual
  nextCursor: string | null    // Cursor para la siguiente página
  hasMore: boolean             // ¿Hay más páginas?
  total?: number               // Total de registros
  page?: number                // Número de página actual (opcional)
}

/** Helper: maps a raw community_stats VIEW row to an AdminCommunity object */
export function mapRowToAdminCommunity(row: any): AdminCommunity {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    image_url: row.image_url,
    member_count: row.member_count || 0,
    is_active: row.is_active,
    visibility: row.visibility,
    access_type: row.access_type,
    course_id: row.course_id,
    created_at: row.created_at,
    updated_at: row.updated_at,

    course: row.course_id_full ? {
      id: row.course_id_full,
      title: row.course_title,
      slug: row.course_slug,
      thumbnail_url: row.course_thumbnail
    } : undefined,

    creator: row.creator_id ? {
      id: row.creator_id,
      username: row.creator_username || '',
      email: row.creator_email || '',
      display_name: row.creator_display_name ||
                   `${row.creator_first_name || ''} ${row.creator_last_name || ''}`.trim(),
      avatar: row.creator_avatar
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
