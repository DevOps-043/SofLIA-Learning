export type ScormObjectivesTable = {
  Row: {
  attempt_id: string | null
  completion_status: string | null
  description: string | null
  id: string
  objective_id: string
  score_max: number | null
  score_min: number | null
  score_raw: number | null
  score_scaled: number | null
  success_status: string | null
}
  Insert: {
  attempt_id?: string | null
  completion_status?: string | null
  description?: string | null
  id?: string
  objective_id: string
  score_max?: number | null
  score_min?: number | null
  score_raw?: number | null
  score_scaled?: number | null
  success_status?: string | null
}
  Update: {
  attempt_id?: string | null
  completion_status?: string | null
  description?: string | null
  id?: string
  objective_id?: string
  score_max?: number | null
  score_min?: number | null
  score_raw?: number | null
  score_scaled?: number | null
  success_status?: string | null
}
  Relationships: [
    { foreignKeyName: "scorm_objectives_attempt_id_fkey"; columns: ["attempt_id"]; isOneToOne: false; referencedRelation: "scorm_attempts"; referencedColumns: ["id"] },
  ]
}
