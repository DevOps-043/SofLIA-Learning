import type { Json } from '../json'

export type PaymentMethodsTable = {
  Row: {
  created_at: string | null
  encrypted_data: Json
  is_active: boolean | null
  is_default: boolean | null
  payment_method_id: string
  payment_method_name: string
  payment_method_type: string
  updated_at: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  encrypted_data: Json
  is_active?: boolean | null
  is_default?: boolean | null
  payment_method_id?: string
  payment_method_name: string
  payment_method_type: string
  updated_at?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  encrypted_data?: Json
  is_active?: boolean | null
  is_default?: boolean | null
  payment_method_id?: string
  payment_method_name?: string
  payment_method_type?: string
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "payment_methods_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "payment_methods_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "payment_methods_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "payment_methods_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
