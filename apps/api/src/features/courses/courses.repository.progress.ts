import { DatabaseError, NotFoundError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import { getServiceClient } from '@/core/supabase/service-client'

import { mapLessonProgress } from './courses.mappers'
import { buildLessonProgressPayload } from './courses.progress-payload'
import { findEnrollment } from './courses.repository.enrollments'
import type { UpdateProgressInput } from './courses.types'

export async function findLessonProgress(
  userId: string,
  courseId: string,
  lessonId: string,
) {
  const supabase = getServiceClient()
  const enrollment = await findEnrollment(userId, courseId)
  if (!enrollment) return null

  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollment.enrollment_id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error) {
    logger.error('Error fetching lesson progress', { error: error.message })
    throw new DatabaseError('Error al obtener progreso de leccion')
  }

  return data ? mapLessonProgress(data) : null
}

export async function upsertLessonProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  data: UpdateProgressInput,
) {
  const supabase = getServiceClient()
  const enrollment = await findEnrollment(userId, courseId)
  if (!enrollment) {
    throw new NotFoundError(`Inscripcion no encontrada para el curso: ${courseId}`)
  }

  const existing = await findExistingLessonProgress(enrollment.enrollment_id, lessonId)
  const { payload, now } = buildLessonProgressPayload(
    userId,
    lessonId,
    enrollment,
    data,
  )
  const result = existing
    ? await supabase
        .from('user_lesson_progress')
        .update(payload)
        .eq('progress_id', existing.progress_id)
        .select('*')
        .single()
    : await supabase
        .from('user_lesson_progress')
        .insert({ ...payload, created_at: now, started_at: now })
        .select('*')
        .single()

  if (result.error || !result.data) {
    logger.error('Error upserting lesson progress', {
      error: result.error?.message,
    })
    throw new DatabaseError('Error al actualizar progreso de leccion')
  }

  return mapLessonProgress(result.data)
}

async function findExistingLessonProgress(enrollmentId: string, lessonId: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('progress_id')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error) {
    logger.error('Error fetching existing lesson progress', { error: error.message })
    throw new DatabaseError('Error al consultar progreso de leccion')
  }

  return data
}
