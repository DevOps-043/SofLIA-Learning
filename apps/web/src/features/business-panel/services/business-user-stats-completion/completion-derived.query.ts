import type { BusinessUserStatsSupabaseClient } from './completion.client'
import type {
  BaseCompletionQueryData,
  DerivedCompletionQueryData,
} from './completion.data'
import {
  fetchCourseModulesForCourses,
  fetchLessonCountsForModules,
  fetchLessonsForProgress,
} from './completion-content.query'
import { collectCompletionDerivedIds } from './completion.ids'
import { fetchInstructorsByIds } from './completion-instructors.query'

export async function fetchDerivedCompletionData(
  supabase: BusinessUserStatsSupabaseClient,
  baseData: BaseCompletionQueryData,
): Promise<DerivedCompletionQueryData> {
  const { lessonIds, courseIds, instructorIds } = collectCompletionDerivedIds(baseData)

  const lessons = await fetchLessonsForProgress(supabase, lessonIds)
  const courseModules = await fetchCourseModulesForCourses(supabase, courseIds)
  const moduleIds = courseModules.map((module) => module.module_id).filter(Boolean)

  const [lessonCounts, instructors] = await Promise.all([
    fetchLessonCountsForModules(supabase, moduleIds),
    fetchInstructorsByIds(supabase, instructorIds),
  ])

  return {
    lessons,
    courseModules,
    lessonCounts,
    instructors,
  }
}
