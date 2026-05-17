export type DialogueSessionRow = {
  session_id: string
  activity_id: string
  course_id: string
  lesson_id: string
  enrollment_id: string
  organization_id: string | null
  user_id: string
  state: string
  current_score: number
  turns_count: number
  hints_used: number
  low_evidence_turns: number
  criteria_met: string[]
  criteria_missing: string[]
  activity_config_snapshot: unknown
  schema_version: string
  rubric_version: string
  prompt_version: string | null
  started_at: string
  completed_at: string | null
  updated_at: string
}

export type DialogueTurnRow = {
  turn_id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  turn_number: number
  client_turn_id: string | null
  state_before: string | null
  state_after: string | null
  metadata: unknown
  created_at: string
}

export type DialogueEvaluationRow = {
  evaluation_id: string
  session_id: string
  turn_id: string | null
  model_name: string | null
  overall_score: number
  decision: string
  recommended_next_state: string
  criteria_met: string[]
  criteria_missing: string[]
  dimension_scores: unknown
  flags: unknown
  feedback_for_tutor: string | null
  backend_notes: string | null
  evidence_quotes: unknown
  raw_payload: unknown
  created_at: string
}

export type DialogueResultRow = {
  result_id: string
  session_id: string
  activity_id: string
  user_id: string
  enrollment_id: string
  activity_result: 'completed' | 'needs_retry'
  score: number
  criteria_met: string[]
  criteria_missing: string[]
  student_feedback: string
  instructor_summary: string | null
  analytics_tags: string[]
  payload: unknown
  created_at: string
}

export type LooseWriteRow = Record<string, unknown>
