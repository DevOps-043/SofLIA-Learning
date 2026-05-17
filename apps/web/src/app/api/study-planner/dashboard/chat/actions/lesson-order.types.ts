import type { Database } from '@/lib/supabase/types'

export type StudySessionRow = Pick<
  Database['public']['Tables']['study_sessions']['Row'],
  'id' | 'plan_id' | 'course_id' | 'lesson_id' | 'start_time' | 'status' | 'title' | 'metrics'
>

export type LessonMetadataRow = {
  lesson_id: string
  lesson_order_index: number
  module_id: string
}

export type ModuleMetadataRow = {
  module_id: string
  module_order_index: number
  course_id: string
}

export type PendingLessonRef = {
  courseId: string
  lessonId: string
  lessonTitle?: string
  moduleOrderIndex: number
  lessonOrderIndex: number
}

export type SessionOrderEntry = {
  sessionId: string
  title: string
  courseId: string
  startTime: string
  sequence: { moduleOrderIndex: number; lessonOrderIndex: number }
}

export type OrderValidationResult = {
  valid: boolean
  code?: 'lesson_order_violation' | 'lesson_order_validation_failed'
  message?: string
}

export type ProposedMove = {
  sessionId: string
  newStartTime: string
}

export type ProposedCreate = {
  title?: string
  startTime: string
  courseId?: string
  lessonId?: string
}
