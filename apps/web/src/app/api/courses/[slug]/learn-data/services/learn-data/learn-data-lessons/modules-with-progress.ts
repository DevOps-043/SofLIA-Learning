import {
  mergeTranslationContexts,
  normalizeLearnLanguage,
} from '../../../../../_services/lesson-language-resolution.service'
import { createEmptyModulesWithProgressResult } from './empty-result'
import { resolveModulesEnrollmentContext } from './enrollment-context'
import { resolveLastWatchedLessonId } from './last-watched'
import { loadBaseLessons, loadTranslatedLessonsMap } from './lessons-query'
import { buildModulesWithLessons } from './module-builder'
import { loadCourseModules } from './module-query'
import { translateModulesForLearnData } from './module-translation'
import { loadLessonProgressData } from './progress-query'
import { resolveLessonsForLanguage } from './resolved-lessons'
import type { ModulesWithProgressResult, SupabaseServerClient } from './types'

export async function loadModulesWithProgress(
  supabase: SupabaseServerClient,
  courseId: string,
  userId: string | undefined,
  language: string,
  organizationId?: string | null,
): Promise<ModulesWithProgressResult> {
  const requestedLanguage = normalizeLearnLanguage(language)
  const modules = await loadCourseModules(supabase, courseId)
  if (!modules || modules.length === 0) {
    return createEmptyModulesWithProgressResult(requestedLanguage)
  }

  const { enrollmentId, resolvedOrganizationId } =
    await resolveModulesEnrollmentContext(
      supabase,
      userId,
      courseId,
      organizationId,
    )

  const [baseLessons, translatedLessonsById, translatedModulesById] = await Promise.all([
    loadBaseLessons(supabase, modules),
    loadTranslatedLessonsMap(supabase, requestedLanguage, modules),
    translateModulesForLearnData(supabase, modules, language),
  ])
  const { lessons, moduleTranslationContexts } = resolveLessonsForLanguage(
    requestedLanguage,
    baseLessons,
    translatedLessonsById,
  )
  const progressData = await loadLessonProgressData(
    supabase,
    enrollmentId,
    lessons.map((lesson) => lesson.lesson_id),
  )
  const modulesWithLessons = buildModulesWithLessons(
    modules,
    lessons,
    progressData,
    translatedModulesById,
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  )
  const allLessons = modulesWithLessons.flatMap((module) => module.lessons)
  const completedLessons = allLessons.filter((lesson) => lesson.is_completed)

  return {
    modules: modulesWithLessons,
    progress: allLessons.length ? Math.round((completedLessons.length / allLessons.length) * 100) : 0,
    lastWatchedLessonId: resolveLastWatchedLessonId(modules, lessons, progressData),
    translationContext: mergeTranslationContexts(moduleTranslationContexts, requestedLanguage),
    enrollmentId,
    organizationId: resolvedOrganizationId,
  }
}
