import type { Json } from '../json'

export type WorkTeamStatisticsTable = {
  Row: {
  active_members: number | null
  average_completion_percentage: number | null
  average_score: number | null
  calculated_at: string
  course_id: string | null
  metadata: Json | null
  stat_date: string
  stat_id: string
  team_id: string
  total_feedback_given: number | null
  total_interactions: number | null
  total_members: number | null
  total_messages: number | null
}
  Insert: {
  active_members?: number | null
  average_completion_percentage?: number | null
  average_score?: number | null
  calculated_at?: string
  course_id?: string | null
  metadata?: Json | null
  stat_date: string
  stat_id?: string
  team_id: string
  total_feedback_given?: number | null
  total_interactions?: number | null
  total_members?: number | null
  total_messages?: number | null
}
  Update: {
  active_members?: number | null
  average_completion_percentage?: number | null
  average_score?: number | null
  calculated_at?: string
  course_id?: string | null
  metadata?: Json | null
  stat_date?: string
  stat_id?: string
  team_id?: string
  total_feedback_given?: number | null
  total_interactions?: number | null
  total_members?: number | null
  total_messages?: number | null
}
  Relationships: [
    { foreignKeyName: "work_team_statistics_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_statistics_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "work_team_statistics_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "work_teams"; referencedColumns: ["team_id"] },
  ]
}
