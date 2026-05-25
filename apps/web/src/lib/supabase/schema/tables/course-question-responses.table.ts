import type { Json } from '../json'

export type CourseQuestionResponsesTable = {
  Row: {
  attachment_data: Json | null
  attachment_type: string | null
  attachment_url: string | null
  content: string
  course_id: string
  created_at: string
  edited_at: string | null
  id: string
  is_approved_answer: boolean | null
  is_deleted: boolean | null
  is_edited: boolean | null
  is_instructor_answer: boolean | null
  organization_id: string | null
  parent_response_id: string | null
  question_id: string
  reaction_count: number | null
  reply_count: number | null
  updated_at: string
  user_id: string
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
  is_approved_answer?: boolean | null
  is_deleted?: boolean | null
  is_edited?: boolean | null
  is_instructor_answer?: boolean | null
  organization_id?: string | null
  parent_response_id?: string | null
  question_id: string
  reaction_count?: number | null
  reply_count?: number | null
  updated_at?: string
  user_id: string
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
  is_approved_answer?: boolean | null
  is_deleted?: boolean | null
  is_edited?: boolean | null
  is_instructor_answer?: boolean | null
  organization_id?: string | null
  parent_response_id?: string | null
  question_id?: string
  reaction_count?: number | null
  reply_count?: number | null
  updated_at?: string
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "course_question_responses_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "course_question_responses_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "course_question_responses_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "course_question_responses_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "course_question_responses_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "course_question_responses_parent_response_id_fkey"; columns: ["parent_response_id"]; isOneToOne: false; referencedRelation: "course_question_responses"; referencedColumns: ["id"] },
    { foreignKeyName: "course_question_responses_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "course_questions"; referencedColumns: ["id"] },
    { foreignKeyName: "course_question_responses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_question_responses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "course_question_responses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_question_responses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
