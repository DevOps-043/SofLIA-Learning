import { DatabaseError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import { getServiceClient } from '@/core/supabase/service-client'

import { mapEnrollment, type UserCourseEnrollmentRow } from './courses.mappers'

export async function findUserEnrollments(userId: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select('course_id, started_at, completed_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (error) {
    logger.error('Error fetching enrollments', { error: error.message })
    throw new DatabaseError('Error al obtener inscripciones')
  }

  return (data ?? []).map((enrollment) => mapEnrollment(enrollment))
}

export async function findEnrollment(
  userId: string,
  courseId: string,
): Promise<UserCourseEnrollmentRow | null> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Error fetching course enrollment', { error: error.message })
    throw new DatabaseError('Error al obtener inscripcion del curso')
  }

  return data
}
