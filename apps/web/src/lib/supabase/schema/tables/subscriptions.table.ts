export type SubscriptionsTable = {
  Row: {
  course_id: string | null
  created_at: string | null
  end_date: string | null
  next_billing_date: string | null
  plan_id: string | null
  price_cents: number
  start_date: string | null
  subscription_id: string
  subscription_status: string | null
  subscription_type: string
  updated_at: string | null
  user_id: string
}
  Insert: {
  course_id?: string | null
  created_at?: string | null
  end_date?: string | null
  next_billing_date?: string | null
  plan_id?: string | null
  price_cents: number
  start_date?: string | null
  subscription_id?: string
  subscription_status?: string | null
  subscription_type: string
  updated_at?: string | null
  user_id: string
}
  Update: {
  course_id?: string | null
  created_at?: string | null
  end_date?: string | null
  next_billing_date?: string | null
  plan_id?: string | null
  price_cents?: number
  start_date?: string | null
  subscription_id?: string
  subscription_status?: string | null
  subscription_type?: string
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "subscriptions_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "subscriptions_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
