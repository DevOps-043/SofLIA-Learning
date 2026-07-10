import type { Json } from '@/lib/supabase/types'

export type NotebookGenerationJobType =
  | 'lesson_auto_note'
  | 'course_compendium'

export type NotebookGenerationJobStatus =
  | 'pending'
  | 'processing'
  | 'done'
  | 'failed'
  | 'skipped'

export type NotebookArtifactStatus = 'partial' | 'ready' | 'failed' | 'stale'

export type GenerationStatus =
  | 'queued'
  | 'processing'
  | 'partial'
  | 'ready'
  | 'failed'
  | 'stale'

export interface NotebookGenerationJob {
  attempts: number
  courseId: string
  createdAt: string
  enrollmentId: string
  finishedAt: string | null
  jobId: string
  jobType: NotebookGenerationJobType
  lastError: string | null
  leaseExpiresAt: string | null
  lessonId: string | null
  lockedBy: string | null
  maxAttempts: number
  nextAttemptAt: string
  noteId: string | null
  organizationId: string
  priority: number
  sourceHash: string
  status: NotebookGenerationJobStatus
  updatedAt: string
  userId: string
}

export interface NotebookGeneratedArtifact {
  artifactId: string
  generatedAt: string | null
  lastError: string | null
  missingArtifacts: Json
  noteId: string | null
  sourceHash: string
  status: NotebookArtifactStatus
  structuredSummary: Json
  updatedAt: string
}

export interface GenerationState {
  noteId?: string
  retryable: boolean
  sourceHash: string
  status: GenerationStatus
  targetType: NotebookGenerationJobType
  updatedAt: string
}

export type NotebookArtifactEvidenceType =
  | 'lia_message'
  | 'dialogue_turn'
  | 'dialogue_feedback'
  | 'quiz_feedback'
  | 'activity_submission'
  | 'activity_feedback'
  | 'course_note'
  | 'generated_note'

export type NotebookArtifactEvidenceRole =
  | 'user'
  | 'assistant'
  | 'feedback'
  | 'content'

export interface NotebookArtifactEvidenceInput {
  content: string
  evidence_type: NotebookArtifactEvidenceType
  metadata: Json
  occurred_at: string | null
  role: NotebookArtifactEvidenceRole | null
  source_id: string
  source_sequence: number
}

export interface NotebookGenerationJobRow {
  attempts: number
  course_id: string
  created_at: string
  enrollment_id: string
  finished_at: string | null
  job_id: string
  job_type: string
  last_error: string | null
  lease_expires_at: string | null
  lesson_id: string | null
  locked_by: string | null
  max_attempts: number
  next_attempt_at: string
  note_id: string | null
  organization_id: string
  priority: number
  source_hash: string
  status: string
  updated_at: string
  user_id: string
}

export interface NotebookGeneratedArtifactRow {
  artifact_id: string
  generated_at: string | null
  last_error: string | null
  missing_artifacts: Json
  note_id: string | null
  source_hash: string
  status: string
  structured_summary: Json
  updated_at: string
}
