import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CourseWithProgress,
  SuggestedCourse,
} from './learning-route.types'
import { getLevelName } from './learning-route-builder.service'

export async function findComplementaryCourses(
  userCourses: CourseWithProgress[],
  supabase: SupabaseClient,
): Promise<SuggestedCourse[]> {
  const suggestedCourses: SuggestedCourse[] = []
  const userCategories = [...new Set(userCourses.map((course) => course.category).filter(Boolean))]
  const userCourseIds = userCourses.map((course) => course.course_id)
  const userLevels = [...new Set(userCourses.map((course) => course.level).filter(Boolean))]
  const missingLevels = getMissingLevels(userLevels)

  if (missingLevels.length === 0 || userCategories.length === 0) {
    return suggestedCourses
  }

  const { data: complementaryCourses } = await supabase
    .from('courses')
    .select('id, title, level, category')
    .in('category', userCategories)
    .in('level', missingLevels)
    .not('id', 'in', `(${userCourseIds.join(',')})`)
    .eq('status', 'published')
    .limit(3)

  for (const course of complementaryCourses ?? []) {
    suggestedCourses.push({
      courseId: course.id,
      title: course.title,
      level: course.level,
      category: course.category,
      reason: `Curso de nivel ${getLevelName(course.level)} para complementar tu ruta de ${course.category}`,
      priority: missingLevels.includes('beginner') ? 'high' : 'medium',
    })
  }

  return suggestedCourses
}

function getMissingLevels(userLevels: Array<string | null>): string[] {
  const missingLevels: string[] = []

  if (!userLevels.includes('beginner')) {
    missingLevels.push('beginner')
  }

  if (!userLevels.includes('intermediate') && userLevels.includes('advanced')) {
    missingLevels.push('intermediate')
  }

  return missingLevels
}
