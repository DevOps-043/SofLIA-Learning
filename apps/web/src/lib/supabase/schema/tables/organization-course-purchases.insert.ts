import type { Json } from '../json'

export type OrganizationCoursePurchasesInsert = {
  access_granted_at?: string | null
  access_status?: string
  billing_month: string
  billing_month_number: number
  billing_year: number
  course_id: string
  created_at?: string
  currency?: string
  discount_cents?: number | null
  discount_type?: string | null
  discount_value?: number | null
  discounted_price_cents: number
  expires_at?: string | null
  final_price_cents: number
  internal_notes?: string | null
  metadata?: Json
  organization_id: string
  original_price_cents: number
  payment_method_id?: string | null
  purchase_id?: string
  purchase_method?: string | null
  purchase_notes?: string | null
  purchased_at?: string
  purchased_by: string
  transaction_id?: string | null
  updated_at?: string
}
