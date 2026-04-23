import { SupabaseClient } from '@supabase/supabase-js'
import { CourseStructureIds } from './types'

export async function getCourseStructureIds(
  supabase: SupabaseClient,
  courseId: string,
): Promise<CourseStructureIds> {
  const { data: courseModules } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', courseId)

  const moduleIds = courseModules?.map((module) => module.module_id) ?? []
  if (moduleIds.length === 0) return { moduleIds, lessonIds: [], activityIds: [] }

  const { data: courseLessons } = await supabase
    .from('course_lessons')
    .select('lesson_id')
    .in('module_id', moduleIds)

  const lessonIds = courseLessons?.map((lesson) => lesson.lesson_id) ?? []
  if (lessonIds.length === 0) return { moduleIds, lessonIds, activityIds: [] }

  const { data: courseActivities } = await supabase
    .from('lesson_activities')
    .select('activity_id')
    .in('lesson_id', lessonIds)

  return {
    moduleIds,
    lessonIds,
    activityIds: courseActivities?.map((activity) => activity.activity_id) ?? [],
  }
}
