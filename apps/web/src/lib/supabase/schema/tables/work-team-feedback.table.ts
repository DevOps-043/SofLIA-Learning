export type WorkTeamFeedbackTable = {
  Row: {
  content: string
  course_id: string | null
  created_at: string
  feedback_id: string
  feedback_type: string
  from_user_id: string
  is_anonymous: boolean | null
  rating: number | null
  team_id: string
  to_user_id: string
  updated_at: string
}
  Insert: {
  content: string
  course_id?: string | null
  created_at?: string
  feedback_id?: string
  feedback_type: string
  from_user_id: string
  is_anonymous?: boolean | null
  rating?: number | null
  team_id: string
  to_user_id: string
  updated_at?: string
}
  Update: {
  content?: string
  course_id?: string | null
  created_at?: string
  feedback_id?: string
  feedback_type?: string
  from_user_id?: string
  is_anonymous?: boolean | null
  rating?: number | null
  team_id?: string
  to_user_id?: string
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "work_team_feedback_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_feedback_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "work_team_feedback_from_user_id_fkey"; columns: ["from_user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_feedback_from_user_id_fkey"; columns: ["from_user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_feedback_from_user_id_fkey"; columns: ["from_user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_feedback_from_user_id_fkey"; columns: ["from_user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_feedback_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "work_teams"; referencedColumns: ["team_id"] },
    { foreignKeyName: "work_team_feedback_to_user_id_fkey"; columns: ["to_user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_feedback_to_user_id_fkey"; columns: ["to_user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_feedback_to_user_id_fkey"; columns: ["to_user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_feedback_to_user_id_fkey"; columns: ["to_user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
