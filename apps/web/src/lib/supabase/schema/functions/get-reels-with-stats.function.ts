export type GetReelsWithStatsFunction = {
  Args: {
    p_category?: string
    p_language?: string
    p_limit?: number
    p_offset?: number
  }
  Returns: {
    category: string
    comment_count: number
    created_at: string
    created_by: string
    creator_first_name: string
    creator_last_name: string
    creator_profile_picture_url: string
    creator_username: string
    description: string
    duration_seconds: number
    hashtags: string[]
    id: string
    is_featured: boolean
    language: string
    like_count: number
    published_at: string
    share_count: number
    thumbnail_url: string
    title: string
    video_url: string
    view_count: number
  }[]
}
