import { logger } from '@/lib/utils/logger'
import { BusinessCourseDetailError } from './errors'
import type { CourseRow, SupabaseServerClient } from './types'

export async function loadCourseById(
  supabase: SupabaseServerClient,
  courseId: string,
) {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, category, level, instructor_id, duration_total_minutes, thumbnail_url, slug, is_active, price, average_rating, student_count, review_count, learning_objectives, created_at, updated_at')
    .eq('id', courseId)
    .single()

  if (error) {
    logger.error('Error fetching business course:', { error, courseId })
    if (error.code === 'PGRST116') {
      throw new BusinessCourseDetailError(
        404,
        `Curso con ID "${courseId}" no encontrado en la base de datos`,
      )
    }
    throw new BusinessCourseDetailError(
      500,
      `Error al obtener el curso: ${error.message || 'Error desconocido'}`,
    )
  }

  if (!data) {
    throw new BusinessCourseDetailError(404, `Curso con ID "${courseId}" no encontrado`)
  }

  return data as CourseRow
}
