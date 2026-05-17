export type WorkTeamCourseAssignmentsTable = {
  Row: {
  assigned_at: string
  assigned_by: string
  course_id: string
  created_at: string
  due_date: string | null
  id: string
  message: string | null
  status: string | null
  team_id: string
  updated_at: string
}
  Insert: {
  assigned_at?: string
  assigned_by: string
  course_id: string
  created_at?: string
  due_date?: string | null
  id?: string
  message?: string | null
  status?: string | null
  team_id: string
  updated_at?: string
}
  Update: {
  assigned_at?: string
  assigned_by?: string
  course_id?: string
  created_at?: string
  due_date?: string | null
  id?: string
  message?: string | null
  status?: string | null
  team_id?: string
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "work_team_course_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_course_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_course_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_course_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_course_assignments_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_course_assignments_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "work_team_course_assignments_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "work_teams"; referencedColumns: ["team_id"] },
  ]
}
