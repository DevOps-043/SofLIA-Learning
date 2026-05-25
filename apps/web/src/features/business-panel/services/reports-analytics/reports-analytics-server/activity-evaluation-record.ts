export interface ActivityEvaluationRecord {
  evaluation_id: string
  submission_id: string
  result_status: string | null
  feedback_payload?: unknown
  model_name?: string | null
  created_at: string | null
}
