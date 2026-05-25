import type { Json } from '../json'

export type TransactionsTable = {
  Row: {
  amount_cents: number
  course_id: string | null
  created_at: string | null
  currency: string
  payment_method_id: string
  processed_at: string | null
  processor_response: Json | null
  processor_transaction_id: string | null
  transaction_id: string
  transaction_status: string
  transaction_type: string
  user_id: string
}
  Insert: {
  amount_cents: number
  course_id?: string | null
  created_at?: string | null
  currency?: string
  payment_method_id: string
  processed_at?: string | null
  processor_response?: Json | null
  processor_transaction_id?: string | null
  transaction_id?: string
  transaction_status?: string
  transaction_type: string
  user_id: string
}
  Update: {
  amount_cents?: number
  course_id?: string | null
  created_at?: string | null
  currency?: string
  payment_method_id?: string
  processed_at?: string | null
  processor_response?: Json | null
  processor_transaction_id?: string | null
  transaction_id?: string
  transaction_status?: string
  transaction_type?: string
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "transactions_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "transactions_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "transactions_payment_method_id_fkey"; columns: ["payment_method_id"]; isOneToOne: false; referencedRelation: "payment_methods"; referencedColumns: ["payment_method_id"] },
    { foreignKeyName: "transactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "transactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "transactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "transactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
