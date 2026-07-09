import type { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { createAdminClient } from '@/lib/supabase/admin'
import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import type { SupportedLanguage } from '@/core/i18n/i18n'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { resolveHlsUrlsForSources } from '@/lib/media/server/hls-source-resolver.server'
import {
  getLessonsTableNameForLanguage,
  mergeTranslationContexts,
  normalizeLearnLanguage,
  resolveLessonContentWithFallback,
  type TranslationContext,
} from '@/app/api/courses/_services/lesson-language-resolution.service'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createSupabaseClient>>
  | ReturnType<typeof createAdminClient>

interface ModuleRow {
  module_id: string
  module_title: string
  module_description?: string | null
  module_order_index: number
  module_duration_minutes?: number | null
  is_published: boolean | null
}

interface LessonRow {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  duration_seconds: number | null
  video_provider_id: string | null
  video_provider: string | null
  is_published: boolean | null
  module_id: string
  transcript_content?: string | null
  summary_content?: string | null
}

interface ProgressRow {
  lesson_id: string
  is_completed: boolean | null
  lesson_status: string | null
  video_progress_percentage: number | null
  last_accessed_at: string | null
  started_at: string | null
}

export interface ModulesWithProgressResult {
  modules: Array<{
    module_id: string
    module_title: string
    module_description?: string | null
    module_order_index: number
    lessons: Array<{
      lesson_id: string
      lesson_title: string
      lesson_description: string | null
      lesson_order_index: number
      duration_seconds: number | null
      video_provider_id: string | null
      video_provider: string | null
      is_completed: boolean
      progress_percentage: number
      transcript_content: string | null
      summary_content: string | null
    }>
  }>
  progress: number
  lastWatchedLessonId: string | null
  translationContext: TranslationContext
  enrollmentId: string | null
  organizationId: string | null
}

function pickPublishedOrAll<T extends { is_published: boolean | null }>(items: T[]) {
  const publishedItems = items.filter((item) => item.is_published === true)
  return publishedItems.length > 0 ? publishedItems : items
}

export function getLessonsTableName(language: string) {
  return getLessonsTableNameForLanguage(normalizeLearnLanguage(language))
}

export function resolveLastWatchedLessonId(
  modules: ModuleRow[],
  lessons: LessonRow[],
  progressData: ProgressRow[],
) {
  if (progressData.length === 0 || lessons.length === 0) {
    return null
  }

  const progressLookup = new Map(
    progressData.map((progress) => [progress.lesson_id, progress]),
  )
  const moduleOrderLookup = new Map(
    modules.map((module) => [module.module_id, module.module_order_index]),
  )
  const orderedLessons = [...lessons].sort((left, right) => {
    const leftModuleOrder = moduleOrderLookup.get(left.module_id) || 0
    const rightModuleOrder = moduleOrderLookup.get(right.module_id) || 0

    if (leftModuleOrder !== rightModuleOrder) {
      return leftModuleOrder - rightModuleOrder
    }

    return left.lesson_order_index - right.lesson_order_index
  })

  let lastValidLessonId: string | null = null
  let lastAccessedInProgress: { lesson_id: string; accessed_at: number } | null =
    null

  // Walk every lesson in course order to find (a) the most recently touched
  // in-progress lesson and (b) the last completed lesson. A lesson with no
  // progress row, or one that's still 'locked'/'not_started', simply means
  // "not completed" — it must NOT stop the scan, since completion is not
  // guaranteed to be contiguous (a learner can skip a lesson and complete
  // later ones; those later completions still need to be seen).
  for (const lesson of orderedLessons) {
    const progress = progressLookup.get(lesson.lesson_id)

    if (!progress) {
      continue
    }

    if (progress.is_completed) {
      lastValidLessonId = lesson.lesson_id
      continue
    }

    if (
      (progress.video_progress_percentage || 0) > 0 ||
      progress.lesson_status === 'in_progress'
    ) {
      const accessTime = progress.last_accessed_at
        ? new Date(progress.last_accessed_at).getTime()
        : progress.started_at
          ? new Date(progress.started_at).getTime()
          : 0

      if (!lastAccessedInProgress || accessTime > lastAccessedInProgress.accessed_at) {
        lastAccessedInProgress = {
          lesson_id: lesson.lesson_id,
          accessed_at: accessTime,
        }
      }

      lastValidLessonId = lesson.lesson_id
    }
  }

  const firstIncompleteLessonId =
    orderedLessons.find((lesson) => !progressLookup.get(lesson.lesson_id)?.is_completed)
      ?.lesson_id ?? null

  return (
    lastAccessedInProgress?.lesson_id ||
    firstIncompleteLessonId ||
    lastValidLessonId ||
    orderedLessons[0]?.lesson_id ||
    null
  )
}

export async function loadCourseBySlug(
  supabase: SupabaseServerClient,
  slug: string,
) {
  const { data, error } = await supabase
    .from('courses')
    .select(
      'id, title, description, thumbnail_url, instructor_id, category, level, price, is_active',
    )
    .eq('slug', slug)
    .single()

  if (error || !data) {
    throw new Error('COURSE_NOT_FOUND')
  }

  return data
}

export async function loadModulesWithProgress(
  supabase: SupabaseServerClient,
  courseId: string,
  userId: string | undefined,
  language: string,
  organizationId?: string | null,
): Promise<ModulesWithProgressResult> {
  const requestedLanguage = normalizeLearnLanguage(language)
  const { data: allModules, error: allModulesError } = await supabase
    .from('course_modules')
    .select(
      'module_id, module_title, module_order_index, module_duration_minutes, is_published, module_description',
    )
    .eq('course_id', courseId)
    .order('module_order_index', { ascending: true })

  if (allModulesError || !allModules) {
    return {
      modules: [],
      progress: 0,
      lastWatchedLessonId: null,
      translationContext: {
        requestedLanguage,
        resolvedLanguage: requestedLanguage,
        usedFallback: false,
        missingPieces: [],
      },
      enrollmentId: null,
      organizationId: null,
    }
  }

  const modules = pickPublishedOrAll(allModules as ModuleRow[])
  if (modules.length === 0) {
    return {
      modules: [],
      progress: 0,
      lastWatchedLessonId: null,
      translationContext: {
        requestedLanguage,
        resolvedLanguage: requestedLanguage,
        usedFallback: false,
        missingPieces: [],
      },
      enrollmentId: null,
      organizationId: null,
    }
  }

  const enrollmentPromise = userId
    ? resolveCourseEnrollment(
      supabase,
      userId,
      courseId,
      organizationId,
    )
    : Promise.resolve(null)

  const moduleIds = modules.map((module) => module.module_id)
  const baseLessonsPromise = supabase
    .from('course_lessons')
    .select(
      'lesson_id, lesson_title, lesson_description, lesson_order_index, duration_seconds, video_provider_id, video_provider, is_published, module_id',
    )
    .in('module_id', moduleIds)
    .order('lesson_order_index', { ascending: true })

  const translatedLessonsPromise =
    requestedLanguage !== 'es'
      ? supabase
          .from(getLessonsTableName(requestedLanguage))
          .select(
            'lesson_id, lesson_title, lesson_description, lesson_order_index, duration_seconds, video_provider_id, video_provider, is_published, module_id',
          )
          .in('module_id', moduleIds)
          .order('lesson_order_index', { ascending: true })
      : Promise.resolve({ data: null })

  const [enrollment, baseLessonsResult, translatedLessonsResult] =
    await Promise.all([
      enrollmentPromise,
      baseLessonsPromise,
      translatedLessonsPromise,
    ])

  const enrollmentId = enrollment?.enrollment_id || null
  const resolvedOrganizationId =
    enrollment?.organization_id || organizationId || null
  const baseLessons = (baseLessonsResult.data || []) as LessonRow[]
  let translatedLessonsById = new Map<string, LessonRow>()
  if (requestedLanguage !== 'es') {
    translatedLessonsById = new Map(
      ((translatedLessonsResult.data || []) as LessonRow[]).map((lesson) => [
        lesson.lesson_id,
        lesson,
      ]),
    )
  }

  const moduleTranslationContexts: TranslationContext[] = []
  const lessons = baseLessons.map((baseLesson) => {
    const translatedLesson =
      requestedLanguage === 'es'
        ? null
        : translatedLessonsById.get(baseLesson.lesson_id) || null

    const resolved = resolveLessonContentWithFallback({
      requestedLanguage,
      baseLesson,
      translatedLesson,
    })

    if (resolved.translationContext.usedFallback) {
      moduleTranslationContexts.push(resolved.translationContext)
    }

    return resolved.lesson as LessonRow
  })
  let progressData: ProgressRow[] = []

  if (enrollmentId && lessons.length > 0) {
    const { data } = await supabase
      .from('user_lesson_progress')
      .select(
        'lesson_id, is_completed, lesson_status, video_progress_percentage, last_accessed_at, started_at',
      )
      .eq('enrollment_id', enrollmentId)
      .in(
        'lesson_id',
        lessons.map((lesson) => lesson.lesson_id),
      )
      .order('last_accessed_at', { ascending: false, nullsFirst: false })

    progressData = (data || []) as ProgressRow[]
  }

  const progressMap = new Map(
    progressData.map((progress) => [progress.lesson_id, progress]),
  )
  const lessonsByModule = new Map<string, LessonRow[]>()

  lessons.forEach((lesson) => {
    const current = lessonsByModule.get(lesson.module_id) || []
    current.push(lesson)
    lessonsByModule.set(lesson.module_id, current)
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  // Build the absolute MP4 URL for every direct-uploaded lesson, then
  // batch-resolve to HLS variants in a single query.  We rewrite
  // video_provider_id to point at the master.m3u8 when available so the
  // CustomVideoPlayer picks up adaptive bitrate playback (with the
  // YouTube-style quality selector) automatically.  Lessons without a
  // completed transcoding job keep their original MP4.
  function buildAbsoluteVideoUrl(lesson: LessonRow): string | null {
    const raw = lesson.video_provider_id
    if (!raw) return null
    if (lesson.video_provider !== 'direct') return raw
    if (raw.startsWith('http')) return raw
    if (!supabaseUrl) return raw
    if (!raw.includes('/')) {
      return `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${raw}`
    }
    const normalizedPath = raw.startsWith('course-videos/') ? raw : `course-videos/${raw}`
    return `${supabaseUrl}/storage/v1/object/public/${normalizedPath}`
  }

  function isStorageVideoEligibleForHls(lesson: LessonRow, absoluteUrl: string): boolean {
    if (lesson.video_provider === 'direct') return true
    if (lesson.video_provider === 'custom') {
      // Current project bucket (may be tagged incorrectly as custom)
      if (absoluteUrl.includes('/storage/v1/object/public/course-videos/')) return true
      // Legacy project bucket — transcoding jobs created via scan-and-queue-legacy
      if (absoluteUrl.includes('/storage/v1/object/public/production-videos/')) return true
    }
    return false
  }

  const sourceUrlByLessonId = new Map<string, string>()
  for (const lesson of lessons) {
    const absoluteUrl = buildAbsoluteVideoUrl(lesson)
    if (absoluteUrl && isStorageVideoEligibleForHls(lesson, absoluteUrl)) {
      sourceUrlByLessonId.set(lesson.lesson_id, absoluteUrl)
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[learn-data] HLS-eligible lessons:', sourceUrlByLessonId.size, '/', lessons.length)
    const sample = Array.from(sourceUrlByLessonId.values()).slice(0, 2)
    if (sample.length > 0) console.log('[learn-data] Sample source URLs:', sample.map((u) => u.slice(-60)))
    const excluded = lessons.filter((l) => {
      const url = buildAbsoluteVideoUrl(l)
      return !url || !isStorageVideoEligibleForHls(l, url)
    })
    if (excluded.length > 0) {
      console.log('[learn-data] Excluded lessons (provider/url):', excluded.slice(0, 3).map((l) => ({ provider: l.video_provider, id_snippet: l.video_provider_id?.slice(0, 60) })))
    }
  }

  const hlsBySourcePromise = resolveHlsUrlsForSources(
    supabase,
    Array.from(sourceUrlByLessonId.values()),
  )

  const translatedModulesPromise =
    requestedLanguage === 'es'
      ? Promise.resolve(modules.map((module) => ({ ...module, id: module.module_id })))
      : ContentTranslationService.translateArray(
          'module',
          modules.map((module) => ({ ...module, id: module.module_id })),
          ['module_title', 'module_description'],
          requestedLanguage as SupportedLanguage,
          supabase,
        )

  const [hlsBySource, translatedModules] = await Promise.all([
    hlsBySourcePromise,
    translatedModulesPromise,
  ])

  if (process.env.NODE_ENV === 'development') {
    console.log('[learn-data] HLS URLs resolved:', hlsBySource.size, '/', sourceUrlByLessonId.size)
  }

  const translatedModulesById = new Map(
    translatedModules.map((module) => [module.module_id, module]),
  )
  const modulesWithLessons = await Promise.all(
    modules.map(async (module) => {
      const translatedModule =
        translatedModulesById.get(module.module_id) || {
          ...module,
          id: module.module_id,
        }
      const lessonsToShow = pickPublishedOrAll(
        lessonsByModule.get(module.module_id) || [],
      )

      return {
        module_id: module.module_id,
        module_title:
          translatedModule.module_title || module.module_title,
        module_description:
          translatedModule.module_description || module.module_description,
        module_order_index: module.module_order_index,
        lessons: lessonsToShow.map((lesson) => {
          const sourceUrl = sourceUrlByLessonId.get(lesson.lesson_id)
          const hlsUrl = sourceUrl ? hlsBySource.get(sourceUrl) : undefined
          const videoUrl = hlsUrl ?? buildAbsoluteVideoUrl(lesson)

          const progress = progressMap.get(lesson.lesson_id)
          return {
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title,
            lesson_description: lesson.lesson_description,
            lesson_order_index: lesson.lesson_order_index,
            duration_seconds: lesson.duration_seconds,
            video_provider_id: videoUrl,
            video_provider: lesson.video_provider,
            is_completed: progress?.is_completed || false,
            progress_percentage: progress?.video_progress_percentage || 0,
            transcript_content: lesson.transcript_content || null,
            summary_content: lesson.summary_content || null,
          }
        }),
      }
    }),
  )

  const allLessons = modulesWithLessons.flatMap((module) => module.lessons)
  const completedLessons = allLessons.filter((lesson) => lesson.is_completed)

  return {
    modules: modulesWithLessons,
    progress:
      allLessons.length > 0
        ? Math.round((completedLessons.length / allLessons.length) * 100)
        : 0,
    lastWatchedLessonId: resolveLastWatchedLessonId(
      modules,
      lessons,
      progressData,
    ),
    translationContext: mergeTranslationContexts(
      moduleTranslationContexts,
      requestedLanguage,
    ),
    enrollmentId,
    organizationId: resolvedOrganizationId,
  }
}

export async function loadCourseQuestions(
  supabase: SupabaseServerClient,
  courseId: string,
  userId: string | undefined,
) {
  interface QuestionRow extends Record<string, unknown> {
    id: string
    response_count?: number | null
  }

  const { data: questions, error } = await supabase
    .from('course_questions')
    .select(
      `
      *,
      user:users!course_questions_user_id_fkey(
        id,
        username,
        display_name,
        first_name,
        last_name,
        profile_picture_url
      )
    `,
    )
    .eq('course_id', courseId)
    .eq('is_hidden', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !questions || questions.length === 0) {
    return []
  }

  const questionRows = questions as QuestionRow[]
  const questionIds = questionRows.map((question) => question.id)
  const userReactionsResult = userId
    ? await supabase
        .from('course_question_reactions')
        .select('question_id, reaction_type')
        .eq('user_id', userId)
        .in('question_id', questionIds)
    : { data: null }
  const userReactionsMap = new Map<string, string>()

  ;(userReactionsResult?.data || []).forEach(
    (reaction: { question_id: string | null; reaction_type: string }) => {
      if (!reaction.question_id) {
        return
      }

      userReactionsMap.set(reaction.question_id, reaction.reaction_type)
    },
  )

  return questionRows.map((question) => ({
    ...question,
    response_count: question.response_count || 0,
    user_reaction: userReactionsMap.get(question.id) || null,
  }))
}
