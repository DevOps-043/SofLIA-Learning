import type { Json } from '@/lib/supabase/types'

export interface ActivityEvaluationRecord {
  submission_id: string
  result_status: string
  feedback_payload: Json
  model_name: string | null
  created_at: string
}
