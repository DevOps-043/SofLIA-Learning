import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnCourseData,
  LearnLesson,
  LearnModule,
} from '../../components/learn/types'

interface WorkshopMetadataLessonPayload {
  lessonId: string
  lessonTitle: string
  lessonDescription?: string
  lessonOrderIndex: number
  durationSeconds?: number
}

interface WorkshopMetadataModulePayload {
  moduleId: string
  moduleTitle: string
  moduleDescription?: string
  moduleOrderIndex: number
  lessons: WorkshopMetadataLessonPayload[]
}

export interface WorkshopMetadataPayload {
  workshopId: string
  workshopTitle: string
  workshopDescription?: string
  modules: WorkshopMetadataModulePayload[]
}

export function buildLearnDataQuery(params: {
  lessonId?: string | null
  language: string
}): string {
  const queryParams = new URLSearchParams()

  if (params.lessonId) {
    queryParams.append('lessonId', params.lessonId)
  }

  queryParams.append('language', params.language)

  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function calculateCourseProgress(modules: LearnModule[]): number {
  const allLessons = modules.flatMap((module) => module.lessons)
  const completedLessons = allLessons.filter((lesson) => lesson.is_completed)

  if (allLessons.length === 0) {
    return 0
  }

  return Math.round((completedLessons.length / allLessons.length) * 100)
}

export function resolveCurrentLesson(
  modules: LearnModule[],
  lastWatchedLessonId?: string | null,
): LearnLesson | null {
  const allLessons = modules.flatMap((module) => module.lessons)
  if (allLessons.length === 0) {
    return null
  }

  if (lastWatchedLessonId) {
    const lastWatchedLesson = allLessons.find(
      (lesson) => lesson.lesson_id === lastWatchedLessonId,
    )

    if (lastWatchedLesson) {
      return lastWatchedLesson
    }
  }

  return allLessons.find((lesson) => !lesson.is_completed) || allLessons[0]
}

export function buildWorkshopMetadataContext(params: {
  metadata: WorkshopMetadataPayload
  slug: string
  userJobTitle?: string
}): CourseLessonContext {
  const { metadata, slug, userJobTitle } = params

  return {
    contextType: 'workshop',
    courseId: metadata.workshopId,
    courseSlug: slug,
    courseTitle: metadata.workshopTitle,
    courseDescription: metadata.workshopDescription,
    allModules: metadata.modules.map((module) => ({
      moduleId: module.moduleId,
      moduleTitle: module.moduleTitle,
      moduleDescription: module.moduleDescription,
      moduleOrderIndex: module.moduleOrderIndex,
      lessons: module.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        lessonTitle: lesson.lessonTitle,
        lessonDescription: lesson.lessonDescription,
        lessonOrderIndex: lesson.lessonOrderIndex,
        durationSeconds: lesson.durationSeconds,
      })),
    })),
    userRole: userJobTitle,
  }
}

export function buildLearnLessonContext(params: {
  course: LearnCourseData | null
  currentLesson: LearnLesson | null
  modules: LearnModule[]
  workshopMetadata: CourseLessonContext | null
  slug: string
  userJobTitle?: string
}): CourseLessonContext | undefined {
  const {
    course,
    currentLesson,
    modules,
    workshopMetadata,
    slug,
    userJobTitle,
  } = params

  if (!course || !currentLesson) {
    return undefined
  }

  const currentModule = modules.find((module) =>
    module.lessons.some((lesson) => lesson.lesson_id === currentLesson.lesson_id),
  )

  if (workshopMetadata) {
    return {
      ...workshopMetadata,
      moduleTitle: currentModule?.module_title,
      lessonTitle: currentLesson.lesson_title,
      lessonDescription: currentLesson.lesson_description,
      durationSeconds: currentLesson.duration_seconds,
      userRole: userJobTitle,
    }
  }

  return {
    contextType: 'course',
    courseId: course.id || course.course_id || undefined,
    courseSlug: slug || undefined,
    courseTitle: course.title || course.course_title,
    courseDescription: course.description || course.course_description,
    moduleTitle: currentModule?.module_title,
    lessonId: currentLesson.lesson_id,
    lessonTitle: currentLesson.lesson_title,
    lessonDescription: currentLesson.lesson_description,
    durationSeconds: currentLesson.duration_seconds,
    userRole: userJobTitle,
  }
}
