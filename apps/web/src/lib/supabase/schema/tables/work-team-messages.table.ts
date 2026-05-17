export type WorkTeamMessagesTable = {
  Row: {
  content: string
  course_id: string | null
  created_at: string
  is_pinned: boolean | null
  message_id: string
  message_type: string | null
  reply_to_message_id: string | null
  sender_id: string
  team_id: string
  updated_at: string
}
  Insert: {
  content: string
  course_id?: string | null
  created_at?: string
  is_pinned?: boolean | null
  message_id?: string
  message_type?: string | null
  reply_to_message_id?: string | null
  sender_id: string
  team_id: string
  updated_at?: string
}
  Update: {
  content?: string
  course_id?: string | null
  created_at?: string
  is_pinned?: boolean | null
  message_id?: string
  message_type?: string | null
  reply_to_message_id?: string | null
  sender_id?: string
  team_id?: string
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "work_team_messages_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_messages_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "work_team_messages_reply_to_fkey"; columns: ["reply_to_message_id"]; isOneToOne: false; referencedRelation: "work_team_messages"; referencedColumns: ["message_id"] },
    { foreignKeyName: "work_team_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_messages_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "work_teams"; referencedColumns: ["team_id"] },
  ]
}
