import type { Json } from '@/lib/supabase/types'

export interface ActivitySubmissionRecord {
  submission_id: string
  course_id: string
  enrollment_id: string
  activity_id: string
  organization_id: string | null
  status: string
  response_text: string | null
  response_payload: Json
  submitted_at: string | null
  last_validated_at: string | null
  created_at: string
  updated_at: string
}
