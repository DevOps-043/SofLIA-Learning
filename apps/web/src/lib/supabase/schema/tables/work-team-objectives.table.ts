export type WorkTeamObjectivesTable = {
  Row: {
  course_id: string | null
  created_at: string
  created_by: string
  current_value: number | null
  deadline: string | null
  description: string | null
  metric_type: string
  objective_id: string
  status: string | null
  target_value: number
  team_id: string
  title: string
  updated_at: string
}
  Insert: {
  course_id?: string | null
  created_at?: string
  created_by: string
  current_value?: number | null
  deadline?: string | null
  description?: string | null
  metric_type: string
  objective_id?: string
  status?: string | null
  target_value: number
  team_id: string
  title: string
  updated_at?: string
}
  Update: {
  course_id?: string | null
  created_at?: string
  created_by?: string
  current_value?: number | null
  deadline?: string | null
  description?: string | null
  metric_type?: string
  objective_id?: string
  status?: string | null
  target_value?: number
  team_id?: string
  title?: string
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "work_team_objectives_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_objectives_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "work_team_objectives_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_objectives_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_objectives_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_objectives_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_objectives_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "work_teams"; referencedColumns: ["team_id"] },
  ]
}
