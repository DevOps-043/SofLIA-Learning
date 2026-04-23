export { getLessonsTableName } from './learn-data-lessons/lessons-table'
export { resolveLastWatchedLessonId } from './learn-data-lessons/last-watched'
export type { ModulesWithProgressResult } from './learn-data-lessons/types'

export async function loadCourseBySlug(...args: Parameters<typeof import('./learn-data-lessons/course-loader').loadCourseBySlug>) {
  const { loadCourseBySlug: loadCourseBySlugImpl } = await import('./learn-data-lessons/course-loader')
  return loadCourseBySlugImpl(...args)
}

export async function loadModulesWithProgress(...args: Parameters<typeof import('./learn-data-lessons/modules-with-progress').loadModulesWithProgress>) {
  const { loadModulesWithProgress: loadModulesWithProgressImpl } = await import('./learn-data-lessons/modules-with-progress')
  return loadModulesWithProgressImpl(...args)
}

export async function loadCourseQuestions(...args: Parameters<typeof import('./learn-data-lessons/course-questions').loadCourseQuestions>) {
  const { loadCourseQuestions: loadCourseQuestionsImpl } = await import('./learn-data-lessons/course-questions')
  return loadCourseQuestionsImpl(...args)
}
