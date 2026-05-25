export type CourseQuestionReactionsTable = {
  Row: {
  created_at: string | null
  id: string
  question_id: string | null
  reaction_type: string
  response_id: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  id?: string
  question_id?: string | null
  reaction_type?: string
  response_id?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  id?: string
  question_id?: string | null
  reaction_type?: string
  response_id?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "course_question_reactions_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "course_questions"; referencedColumns: ["id"] },
    { foreignKeyName: "course_question_reactions_response_id_fkey"; columns: ["response_id"]; isOneToOne: false; referencedRelation: "course_question_responses"; referencedColumns: ["id"] },
    { foreignKeyName: "course_question_reactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_question_reactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "course_question_reactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_question_reactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
