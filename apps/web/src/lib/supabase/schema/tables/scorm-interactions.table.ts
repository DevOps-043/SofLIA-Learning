export type ScormInteractionsTable = {
  Row: {
  attempt_id: string | null
  correct_response: string | null
  description: string | null
  id: string
  interaction_id: string
  interaction_type: string | null
  latency: unknown
  learner_response: string | null
  result: string | null
  timestamp: string | null
  weighting: number | null
}
  Insert: {
  attempt_id?: string | null
  correct_response?: string | null
  description?: string | null
  id?: string
  interaction_id: string
  interaction_type?: string | null
  latency?: unknown
  learner_response?: string | null
  result?: string | null
  timestamp?: string | null
  weighting?: number | null
}
  Update: {
  attempt_id?: string | null
  correct_response?: string | null
  description?: string | null
  id?: string
  interaction_id?: string
  interaction_type?: string | null
  latency?: unknown
  learner_response?: string | null
  result?: string | null
  timestamp?: string | null
  weighting?: number | null
}
  Relationships: [
    { foreignKeyName: "scorm_interactions_attempt_id_fkey"; columns: ["attempt_id"]; isOneToOne: false; referencedRelation: "scorm_attempts"; referencedColumns: ["id"] },
  ]
}
