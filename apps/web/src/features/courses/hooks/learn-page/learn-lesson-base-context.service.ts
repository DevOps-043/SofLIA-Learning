import type { CourseLessonContext } from '../../../../core/types/lia.types'
import { resolveVerifiedLessonDurationMinutes } from './lesson-duration.service'
import type { BuildLearnLessonContextParams } from './learn-lesson-context.types'

export function buildLearnLessonBaseContext(
  params: BuildLearnLessonContextParams,
): CourseLessonContext | undefined {
  const { course, currentLesson, modules, slug, userJobTitle, workshopMetadata } =
    params

  if (!course || !currentLesson) {
    return undefined
  }

  const currentModule = modules.find((module) =>
    module.lessons.some((lesson) => lesson.lesson_id === currentLesson.lesson_id),
  )
  const totalDurationMinutes =
    resolveVerifiedLessonDurationMinutes(currentLesson)
  const lessonFields = {
    moduleId: currentModule?.module_id,
    moduleTitle: currentModule?.module_title,
    lessonId: currentLesson.lesson_id,
    lessonTitle: currentLesson.lesson_title,
    lessonDescription: currentLesson.lesson_description,
    durationSeconds: currentLesson.duration_seconds,
    totalDurationMinutes,
    userRole: userJobTitle,
  }

  if (workshopMetadata) {
    return { ...workshopMetadata, ...lessonFields }
  }

  return {
    contextType: 'course',
    courseId: course.id || course.course_id || undefined,
    courseSlug: slug || undefined,
    courseTitle: course.title || course.course_title,
    courseDescription: course.description || course.course_description,
    ...lessonFields,
  }
}
