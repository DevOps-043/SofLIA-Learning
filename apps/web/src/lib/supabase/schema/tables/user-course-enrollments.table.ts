export type UserCourseEnrollmentsTable = {
  Row: {
  completed_at: string | null
  course_id: string
  course_intro_watched_at: string | null
  created_at: string | null
  enrolled_at: string | null
  enrollment_id: string
  enrollment_status: string | null
  last_accessed_at: string | null
  organization_id: string | null
  overall_progress_percentage: number | null
  started_at: string | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  completed_at?: string | null
  course_id: string
  course_intro_watched_at?: string | null
  created_at?: string | null
  enrolled_at?: string | null
  enrollment_id?: string
  enrollment_status?: string | null
  last_accessed_at?: string | null
  organization_id?: string | null
  overall_progress_percentage?: number | null
  started_at?: string | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  completed_at?: string | null
  course_id?: string
  course_intro_watched_at?: string | null
  created_at?: string | null
  enrolled_at?: string | null
  enrollment_id?: string
  enrollment_status?: string | null
  last_accessed_at?: string | null
  organization_id?: string | null
  overall_progress_percentage?: number | null
  started_at?: string | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_course_enrollments_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "user_course_enrollments_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "user_course_enrollments_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_course_enrollments_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_course_enrollments_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_course_enrollments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_course_enrollments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_course_enrollments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_course_enrollments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
