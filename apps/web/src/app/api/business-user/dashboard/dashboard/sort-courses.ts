import { logger } from '@/lib/utils/logger'
import type {
  AssignedCourse,
  DashboardSupabaseClient,
  LearningPathItemPositionRow,
} from './types'

export async function sortCoursesByLearningPathPosition(
  supabase: DashboardSupabaseClient,
  courses: AssignedCourse[]
): Promise<void> {
  if (courses.length === 0) {
    return
  }

  try {
    const assignedCourseIds = courses.map((course) => course.course_id)
    const { data: lpItems, error } = await supabase
      .from('learning_path_items')
      .select('course_id, position, learning_path_id')
      .in('course_id', assignedCourseIds)
      .order('position', { ascending: true })
      .returns<LearningPathItemPositionRow[]>()

    if (error || !lpItems?.length) {
      return
    }

    const coursePositionMap = new Map<string, number>()
    for (const item of lpItems) {
      const existingPosition = coursePositionMap.get(item.course_id)
      if (existingPosition === undefined || item.position < existingPosition) {
        coursePositionMap.set(item.course_id, item.position)
      }
    }

    courses.forEach((course) => {
      const position = coursePositionMap.get(course.course_id)
      if (position !== undefined) course.learning_path_position = position
    })
    courses.sort(
      (a, b) => (a.learning_path_position ?? Infinity) - (b.learning_path_position ?? Infinity)
    )
    logger.log('🔢 Courses sorted by learning path position:', coursePositionMap.size, 'courses mapped')
  } catch (sortError) {
    logger.error('Error sorting courses by learning path position:', sortError)
  }
}
