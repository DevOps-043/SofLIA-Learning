export interface CommunityRecord {
  id: string
  name: string
  slug: string
  access_type?: string
}

export interface CommunityUserRow {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
  profile_picture_url: string | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  bio: string | null
  location: string | null
  created_at: string
  points?: number | null
  profile_visibility?: string | null
}

export interface CommunityMemberRow {
  id: string
  role: string
  joined_at: string
  user_id: string
  users: CommunityUserRow
}

export interface CommunityMemberStats {
  posts_count: number
  comments_count: number
  reactions_given: number
  reactions_received: number
  points: number
}

export interface CommunityMemberResponse {
  id: string
  role: string
  joined_at: string
  rank: number
  total_members: number
  user: {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
    username: string | null
    profile_picture_url: string | null
    linkedin_url: string | null
    github_url: string | null
    portfolio_url: string | null
    bio: string | null
    location: string | null
    created_at: string
    profile_visibility: string
  }
  stats: CommunityMemberStats
}

export interface ApiRouteResult {
  status: number
  body: Record<string, unknown>
}
