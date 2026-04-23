import { logger } from '@/lib/utils/logger'
import type {
  AssignedCourse,
  LearningPathItemPositionRow,
  SupabaseServerClient,
} from './types'

export async function sortCoursesByLearningPathPosition(
  supabase: SupabaseServerClient,
  courses: AssignedCourse[],
) {
  if (!courses.length) return

  try {
    const { data, error } = await supabase
      .from('learning_path_items')
      .select('course_id, position, learning_path_id')
      .in('course_id', courses.map((course) => course.course_id))
      .order('position', { ascending: true })
      .returns<LearningPathItemPositionRow[]>()

    if (error || !data?.length) return

    const coursePositionMap = new Map<string, number>()
    data.forEach((item) => {
      const current = coursePositionMap.get(item.course_id)
      if (current === undefined || item.position < current) {
        coursePositionMap.set(item.course_id, item.position)
      }
    })

    courses.forEach((course) => {
      const position = coursePositionMap.get(course.course_id)
      if (position !== undefined) course.learning_path_position = position
    })
    courses.sort(
      (left, right) =>
        (left.learning_path_position ?? Infinity) -
        (right.learning_path_position ?? Infinity),
    )
    logger.log('Courses sorted by learning path position:', coursePositionMap.size, 'courses mapped')
  } catch (error) {
    logger.error('Error sorting courses by learning path position:', error)
  }
}
