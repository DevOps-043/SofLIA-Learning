import type { Json } from '@/lib/supabase/types'

export interface QuizSubmissionRecord {
  submission_id: string
  enrollment_id: string
  organization_id: string | null
  percentage_score: number | null
  score: number | null
  total_points: number | null
  user_answers: Json
  is_passed: boolean | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
}
