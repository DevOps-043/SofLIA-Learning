import type { Json } from '../json'

export type GetPostsWithStatsFunction = {
  Args: { p_community_id: string; p_limit?: number; p_offset?: number }
  Returns: {
    attachment_data: Json
    attachment_type: string
    attachment_url: string
    comments_count: number
    community_id: string
    content: string
    created_at: string
    is_edited: boolean
    is_pinned: boolean
    post_id: string
    reaction_count: number
    reaction_stats: Json
    title: string
    updated_at: string
    user_display_name: string
    user_id: string
    user_profile_picture_url: string
    user_username: string
  }[]
}
