import { translateLessonActivities } from './activity-translator'
import { translateLessonEntity } from './lesson-translator'
import { translateLessonMaterials } from './material-translator'
import { ensureCourseReport, summarizeReports, updateReport } from './reports'
import type {
  CourseReport,
  EntityProgress,
  LessonRow,
  TranslationOptions,
  TranslationSupabaseClient,
} from './types'

export async function processLessonsForTranslation(
  supabase: TranslationSupabaseClient,
  lessons: LessonRow[],
  options: TranslationOptions,
  userId: string,
) {
  const courseReports = new Map<string, CourseReport>()
  const details: EntityProgress[] = []

  for (const lesson of lessons) {
    const courseId = lesson.course_modules.course_id
    recordProgress(courseReports, details, await translateLessonEntity(supabase, lesson, userId))

    if (options.includeActivities) {
      const activities = await translateLessonActivities(
        supabase,
        lesson.lesson_id,
        courseId,
        userId,
      )
      activities.forEach((progress) => recordProgress(courseReports, details, progress))
    }

    if (options.includeMaterials) {
      const materials = await translateLessonMaterials(
        supabase,
        lesson.lesson_id,
        courseId,
        userId,
      )
      materials.forEach((progress) => recordProgress(courseReports, details, progress))
    }
  }

  const reportByCourse = Array.from(courseReports.values())
  return { summary: summarizeReports(reportByCourse), reportByCourse, details }
}

function recordProgress(
  courseReports: Map<string, CourseReport>,
  details: EntityProgress[],
  progress: EntityProgress,
) {
  const report = ensureCourseReport(courseReports, progress.courseId)
  details.push(progress)
  updateReport(report, progress.status)
}
