import { normalizeDirectVideoProviderId } from './shared'
import type { CreateLessonData, UpdateLessonData } from './types'

export function assertCreateLessonDuration(lessonData: CreateLessonData) {
  if (!lessonData.duration_seconds || lessonData.duration_seconds <= 0) {
    throw new Error(
      'La duración debe ser mayor a 0 segundos. Por favor, ingrese una duración válida.',
    )
  }
}

export function normalizeDuration(durationSeconds: number) {
  return Math.max(1, Math.floor(durationSeconds))
}

export function buildCreateLessonPayload(
  moduleId: string,
  lessonData: CreateLessonData,
  existingLessonsCount: number | null,
) {
  const now = new Date().toISOString()

  return {
    module_id: moduleId,
    lesson_title: lessonData.lesson_title,
    lesson_description: lessonData.lesson_description,
    lesson_order_index: (existingLessonsCount || 0) + 1,
    video_provider_id: normalizeDirectVideoProviderId(
      lessonData.video_provider_id,
      lessonData.video_provider,
    ),
    video_provider: lessonData.video_provider,
    duration_seconds: normalizeDuration(lessonData.duration_seconds),
    transcript_content: lessonData.transcript_content,
    summary_content: lessonData.summary_content,
    is_published: lessonData.is_published ?? false,
    instructor_id: lessonData.instructor_id,
    created_at: now,
    updated_at: now,
  }
}

export function buildUpdateLessonPayload(lessonData: UpdateLessonData) {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (lessonData.lesson_title !== undefined) updateData.lesson_title = lessonData.lesson_title
  if (lessonData.lesson_description !== undefined) updateData.lesson_description = lessonData.lesson_description
  if (lessonData.video_provider_id !== undefined) {
    updateData.video_provider_id = normalizeDirectVideoProviderId(
      lessonData.video_provider_id,
      lessonData.video_provider || 'custom',
    )
  }
  if (lessonData.video_provider !== undefined) updateData.video_provider = lessonData.video_provider
  if (lessonData.duration_seconds !== undefined) {
    updateData.duration_seconds = normalizeDuration(lessonData.duration_seconds)
  }
  if (lessonData.transcript_content !== undefined) updateData.transcript_content = lessonData.transcript_content
  if (lessonData.summary_content !== undefined) updateData.summary_content = lessonData.summary_content
  if (lessonData.is_published !== undefined) updateData.is_published = lessonData.is_published
  if (lessonData.instructor_id !== undefined) updateData.instructor_id = lessonData.instructor_id

  return updateData
}
