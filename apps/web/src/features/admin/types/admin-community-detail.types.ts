import type { AdminCommunity } from '../services/adminCommunities.service'

interface AdminCommunityUserSummary {
  id?: string
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  profile_picture_url?: string | null
  cargo_rol?: string | null
}

export interface AdminCommunityPost {
  id: string
  content: string
  created_at: string
  likes_count?: number | null
  comments_count?: number | null
  is_pinned?: boolean | null
  is_hidden?: boolean | null
  attachment_url?: string | null
  attachment_type?: string | null
  poll_data?: {
    question?: string
    options?: string[]
  } | null
  users?: AdminCommunityUserSummary | null
  comments?: unknown[]
  reactions?: unknown[]
  attachments?: Array<{ url?: string | null; type?: string | null; name?: string }>
  links?: unknown[]
  [key: string]: unknown
}

export interface AdminCommunityMember {
  id: string
  role: string
  joined_at: string
  is_active?: boolean
  updated_at?: string
  user_id?: string
  name?: string
  users?: AdminCommunityUserSummary | null
  [key: string]: unknown
}

export interface AdminCommunityAccessRequest {
  id: string
  status: string
  note?: string | null
  created_at: string
  reviewed_at?: string | null
  requester_id?: string
  reviewed_by?: string | null
  requester?: AdminCommunityUserSummary | null
  reviewer?: AdminCommunityUserSummary | null
  [key: string]: unknown
}

export interface AdminCommunityVideo {
  id: string
  title: string
  description?: string | null
  video_provider?: string | null
  thumbnail_url?: string | null
  duration?: number | null
  created_at: string
  [key: string]: unknown
}

export interface AdminCommunityDetailPayload {
  community: AdminCommunity
  posts: AdminCommunityPost[]
  members: AdminCommunityMember[]
  accessRequests: AdminCommunityAccessRequest[]
  videos: AdminCommunityVideo[]
}

export type AdminCommunityDetailTabId = 'posts' | 'members' | 'requests' | 'videos' | 'reports'
