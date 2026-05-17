export type GetCommentsWithUserDataFunction = {
  Args: { p_limit?: number; p_offset?: number; p_post_id: string }
  Returns: {
    comment_id: string
    content: string
    created_at: string
    parent_comment_id: string
    post_id: string
    reply_count: number
    updated_at: string
    user_display_name: string
    user_id: string
    user_profile_picture_url: string
    user_username: string
  }[]
}
