import type { Json } from '../json'

export type CourseQuestionsTable = {
  Row: {
  attachment_data: Json | null
  attachment_type: string | null
  attachment_url: string | null
  content: string
  course_id: string
  created_at: string
  edited_at: string | null
  id: string
  is_edited: boolean | null
  is_hidden: boolean | null
  is_pinned: boolean | null
  is_resolved: boolean | null
  organization_id: string | null
  reaction_count: number | null
  response_count: number | null
  tags: string[] | null
  title: string | null
  updated_at: string
  user_id: string
  view_count: number | null
}
  Insert: {
  attachment_data?: Json | null
  attachment_type?: string | null
  attachment_url?: string | null
  content: string
  course_id: string
  created_at?: string
  edited_at?: string | null
  id?: string
  is_edited?: boolean | null
  is_hidden?: boolean | null
  is_pinned?: boolean | null
  is_resolved?: boolean | null
  organization_id?: string | null
  reaction_count?: number | null
  response_count?: number | null
  tags?: string[] | null
  title?: string | null
  updated_at?: string
  user_id: string
  view_count?: number | null
}
  Update: {
  attachment_data?: Json | null
  attachment_type?: string | null
  attachment_url?: string | null
  content?: string
  course_id?: string
  created_at?: string
  edited_at?: string | null
  id?: string
  is_edited?: boolean | null
  is_hidden?: boolean | null
  is_pinned?: boolean | null
  is_resolved?: boolean | null
  organization_id?: string | null
  reaction_count?: number | null
  response_count?: number | null
  tags?: string[] | null
  title?: string | null
  updated_at?: string
  user_id?: string
  view_count?: number | null
}
  Relationships: [
    { foreignKeyName: "course_questions_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "course_questions_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "course_questions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "course_questions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "course_questions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "course_questions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_questions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "course_questions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_questions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
