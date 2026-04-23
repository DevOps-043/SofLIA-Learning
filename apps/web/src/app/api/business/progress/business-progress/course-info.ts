import { logger } from '@/lib/utils/logger'
import type { AssignmentRow, BusinessProgressSupabaseClient, CourseInfo } from './types'

export async function fetchCourseInfoMap(
  supabase: BusinessProgressSupabaseClient,
  assignments: AssignmentRow[],
) {
  const courseInfoMap = new Map<string, CourseInfo>()
  if (assignments.length === 0) return courseInfoMap

  const courseIds = [...new Set(assignments.map((assignment) => assignment.course_id))]
  logger.log('📚 IDs de cursos a buscar:', courseIds)

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url')
    .in('id', courseIds)

  if (error) {
    logger.error('Error fetching courses:', error)
    return courseInfoMap
  }

  logger.log('✅ Cursos obtenidos:', data?.length || 0)
  ;(data || []).forEach((course) => {
    courseInfoMap.set(course.id, {
      id: course.id,
      title: course.title,
      slug: course.slug || null,
      thumbnail_url: course.thumbnail_url || null,
    })
  })
  logger.log('📊 Map de cursos creado con', courseInfoMap.size, 'entradas')

  return courseInfoMap
}
