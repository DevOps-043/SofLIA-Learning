export type CourseReviewsTable = {
  Row: {
  course_id: string
  created_at: string | null
  is_public: boolean | null
  is_verified: boolean | null
  rating: number
  review_content: string
  review_id: string
  review_title: string | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  course_id: string
  created_at?: string | null
  is_public?: boolean | null
  is_verified?: boolean | null
  rating: number
  review_content: string
  review_id?: string
  review_title?: string | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  course_id?: string
  created_at?: string | null
  is_public?: boolean | null
  is_verified?: boolean | null
  rating?: number
  review_content?: string
  review_id?: string
  review_title?: string | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "course_reviews_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "course_reviews_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "course_reviews_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_reviews_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "course_reviews_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_reviews_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
