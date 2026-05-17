import type { Json } from '../json'

export type UserActivityEvaluationsTable = {
  Row: {
  created_at: string
  evaluation_id: string
  evaluator: string
  feedback_payload: Json
  model_name: string | null
  result_status: string
  rubric_snapshot: Json
  submission_id: string
}
  Insert: {
  created_at?: string
  evaluation_id?: string
  evaluator?: string
  feedback_payload?: Json
  model_name?: string | null
  result_status: string
  rubric_snapshot?: Json
  submission_id: string
}
  Update: {
  created_at?: string
  evaluation_id?: string
  evaluator?: string
  feedback_payload?: Json
  model_name?: string | null
  result_status?: string
  rubric_snapshot?: Json
  submission_id?: string
}
  Relationships: [
    { foreignKeyName: "user_activity_evaluations_submission_id_fkey"; columns: ["submission_id"]; isOneToOne: false; referencedRelation: "user_activity_submissions"; referencedColumns: ["submission_id"] },
  ]
}
