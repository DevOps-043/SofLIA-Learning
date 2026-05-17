import type { Json } from '../json'

export type WorkTeamsTable = {
  Row: {
  course_id: string | null
  created_at: string
  created_by: string
  description: string | null
  image_url: string | null
  metadata: Json | null
  name: string
  organization_id: string
  slug: string
  status: string | null
  team_id: string
  team_leader_id: string | null
  updated_at: string
}
  Insert: {
  course_id?: string | null
  created_at?: string
  created_by: string
  description?: string | null
  image_url?: string | null
  metadata?: Json | null
  name: string
  organization_id: string
  slug: string
  status?: string | null
  team_id?: string
  team_leader_id?: string | null
  updated_at?: string
}
  Update: {
  course_id?: string | null
  created_at?: string
  created_by?: string
  description?: string | null
  image_url?: string | null
  metadata?: Json | null
  name?: string
  organization_id?: string
  slug?: string
  status?: string | null
  team_id?: string
  team_leader_id?: string | null
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "work_teams_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "work_teams_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "work_teams_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_teams_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "work_teams_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_teams_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_teams_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "work_teams_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "work_teams_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "work_teams_team_leader_id_fkey"; columns: ["team_leader_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_teams_team_leader_id_fkey"; columns: ["team_leader_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "work_teams_team_leader_id_fkey"; columns: ["team_leader_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_teams_team_leader_id_fkey"; columns: ["team_leader_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
