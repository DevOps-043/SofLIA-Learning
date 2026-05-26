import type { BusinessUserStatsSupabaseClient } from './completion.client'
import type {
  BaseCompletionQueryData,
  DerivedCompletionQueryData,
} from './completion.data'
import {
  fetchLessonActivitiesForLessons,
  fetchCourseModulesForCourses,
  fetchLessonCountsForModules,
  fetchLessonsForProgress,
  fetchPublishedLessonsForModules,
  mergeLessonRecords,
} from './completion-content.query'
import { collectCompletionDerivedIds } from './completion.ids'
import { fetchInstructorsByIds } from './completion-instructors.query'

export async function fetchDerivedCompletionData(
  supabase: BusinessUserStatsSupabaseClient,
  baseData: BaseCompletionQueryData,
): Promise<DerivedCompletionQueryData> {
  const { lessonIds, courseIds, instructorIds } = collectCompletionDerivedIds(baseData)

  const progressLessons = await fetchLessonsForProgress(supabase, lessonIds)
  const courseModules = await fetchCourseModulesForCourses(supabase, courseIds)
  const moduleIds = courseModules.map((module) => module.module_id).filter(Boolean)

  const [publishedLessons, lessonCounts, instructors] = await Promise.all([
    fetchPublishedLessonsForModules(supabase, moduleIds),
    fetchLessonCountsForModules(supabase, moduleIds),
    fetchInstructorsByIds(supabase, instructorIds),
  ])
  const lessonActivities = await fetchLessonActivitiesForLessons(
    supabase,
    lessonCounts.map((lesson) => lesson.lesson_id).filter(Boolean),
  )

  return {
    lessons: mergeLessonRecords(publishedLessons, progressLessons),
    courseModules,
    lessonCounts,
    lessonActivities,
    instructors,
  }
}
