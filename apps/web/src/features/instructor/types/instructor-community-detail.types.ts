import type { InstructorCommunity } from '../services/instructorCommunities.service'

interface CommunityUserSummary {
  id?: string
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  profile_picture_url?: string | null
  cargo_rol?: string | null
}

export interface CommunityPost {
  id: string
  content: string
  author_id?: string
  created_at: string
  likes_count?: number
  comments_count?: number
  is_pinned?: boolean
  is_hidden?: boolean
  users?: CommunityUserSummary | null
  comments?: unknown[]
  reactions?: unknown[]
  attachments?: Array<{ url?: string | null; type?: string | null; name?: string }>
  links?: unknown[]
  [key: string]: unknown
}

export interface CommunityMember {
  id: string
  user_id?: string
  role: string
  joined_at: string
  name?: string
  users?: CommunityUserSummary | null
  [key: string]: unknown
}

export interface CommunityAccessRequest {
  id: string
  user_id?: string
  requester_id?: string
  status: string
  note?: string | null
  created_at: string
  requester?: CommunityUserSummary | null
  reviewer?: CommunityUserSummary | null
  [key: string]: unknown
}

export interface CommunityVideo {
  id: string
  title: string
  url?: string
  description?: string | null
  video_provider?: string | null
  thumbnail_url?: string | null
  duration?: number | null
  created_at: string
  [key: string]: unknown
}

export interface InstructorCommunityDetailPayload {
  community: InstructorCommunity
  posts: CommunityPost[]
  members: CommunityMember[]
  accessRequests: CommunityAccessRequest[]
  videos: CommunityVideo[]
}
