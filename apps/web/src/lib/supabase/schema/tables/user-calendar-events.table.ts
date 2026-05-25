export type UserCalendarEventsTable = {
  Row: {
  color: string | null
  created_at: string | null
  description: string | null
  end_time: string
  google_event_id: string | null
  id: string
  is_all_day: boolean | null
  location: string | null
  microsoft_event_id: string | null
  provider: string | null
  source: string | null
  start_time: string
  title: string
  updated_at: string | null
  user_id: string
}
  Insert: {
  color?: string | null
  created_at?: string | null
  description?: string | null
  end_time: string
  google_event_id?: string | null
  id?: string
  is_all_day?: boolean | null
  location?: string | null
  microsoft_event_id?: string | null
  provider?: string | null
  source?: string | null
  start_time: string
  title: string
  updated_at?: string | null
  user_id: string
}
  Update: {
  color?: string | null
  created_at?: string | null
  description?: string | null
  end_time?: string
  google_event_id?: string | null
  id?: string
  is_all_day?: boolean | null
  location?: string | null
  microsoft_event_id?: string | null
  provider?: string | null
  source?: string | null
  start_time?: string
  title?: string
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_calendar_events_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_calendar_events_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_calendar_events_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_calendar_events_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
