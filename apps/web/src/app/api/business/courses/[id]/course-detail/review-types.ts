export interface CourseReviewUserRow {
  display_name: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
  profile_picture_url: string | null
}

export interface CourseReviewRow {
  review_id: string
  review_title: string | null
  review_content: string | null
  rating: number | null
  is_verified: boolean | null
  created_at: string
  user_id: string
  users: CourseReviewUserRow | null
}
