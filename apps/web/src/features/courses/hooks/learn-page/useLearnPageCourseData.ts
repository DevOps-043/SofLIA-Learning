'use client'

import { useEffect } from 'react'
import { dedupedFetch } from '../../../../lib/supabase/request-deduplication'
import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnCourseData,
  LearnPathBlockState,
  LearnLesson,
  LearnModule,
  LearnNotesStats,
  LearnPathState,
  LearnTranslationContext,
} from '../../components/learn/types'
import {
  buildLearnDataQuery,
  buildWorkshopMetadataContext,
  calculateCourseProgress,
  resolveCurrentLesson,
  type WorkshopMetadataPayload,
} from './learn-page.service'

interface LearnDataResponse {
  course?: LearnCourseData
  modules?: LearnModule[]
  lastWatchedLessonId?: string
  notesStats?: LearnNotesStats
  learningPath?: LearnPathState | null
  translationContext?: LearnTranslationContext
}

interface LearnDataErrorResponse {
  error?: string
  message?: string
  learningPath?: LearnPathState | null
}

interface WorkshopMetadataResponse {
  success?: boolean
  metadata?: WorkshopMetadataPayload
}

type LessonSupplementKey = 'transcript_content' | 'summary_content'

type LessonSupplementResponse = Partial<
  Record<LessonSupplementKey, string | null | undefined>
>

interface UseLearnPageCourseDataParams {
  slug: string
  selectedLang: string
  organizationId?: string | null
  userJobTitle?: string
  currentLesson: LearnLesson | null
  modules: LearnModule[]
  notesStatsLessonsWithNotes: string
  applyServerNotesStats: (stats: LearnNotesStats) => void
  initializeNotesStats: () => void
  setCourse: (course: LearnCourseData | null) => void
  setModules: (modules: LearnModule[]) => void
  setCurrentLesson: (lesson: LearnLesson | null) => void
  setWorkshopMetadata: (context: CourseLessonContext | null) => void
  setLiaTranscript: (transcript: string | null) => void
  setLiaSummary: (summary: string | null) => void
  setIsLiaTranscriptLoading: (loading: boolean) => void
  setIsLiaSummaryLoading: (loading: boolean) => void
  setLoading: (loading: boolean) => void
  setCourseProgress: (progress: number) => void
  setLearningPathState: (state: LearnPathState | null) => void
  setLearningPathBlockState: (state: LearnPathBlockState | null) => void
  setLearnDataTranslationContext: (
    context: LearnTranslationContext | null,
  ) => void
}

class LearnDataRequestError extends Error {
  status: number
  payload: LearnDataErrorResponse | null

  constructor(status: number, payload: LearnDataErrorResponse | null) {
    super(payload?.message || `HTTP ${status}`)
    this.name = 'LearnDataRequestError'
    this.status = status
    this.payload = payload
  }
}

async function loadLearnData(
  url: string,
  init?: RequestInit,
): Promise<LearnDataResponse> {
  const response = await fetch(url, init)
  const payload = (await response
    .json()
    .catch(() => null)) as LearnDataResponse | LearnDataErrorResponse | null

  if (!response.ok) {
    throw new LearnDataRequestError(
      response.status,
      (payload as LearnDataErrorResponse | null) ?? null,
    )
  }

  return (payload as LearnDataResponse | null) ?? {}
}

async function loadLessonSupplement({
  url,
  contentKey,
  signal,
}: {
  url: string
  contentKey: LessonSupplementKey
  signal: AbortSignal
}): Promise<string | null> {
  const response = await fetch(url, {
    credentials: 'include',
    signal,
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as LessonSupplementResponse
  const content = data[contentKey]

  return typeof content === 'string' && content.trim().length > 0
    ? content
    : null
}

export function useLearnPageCourseData({
  slug,
  selectedLang,
  organizationId,
  userJobTitle,
  currentLesson,
  modules,
  notesStatsLessonsWithNotes,
  applyServerNotesStats,
  initializeNotesStats,
  setCourse,
  setModules,
  setCurrentLesson,
  setWorkshopMetadata,
  setLiaTranscript,
  setLiaSummary,
  setIsLiaTranscriptLoading,
  setIsLiaSummaryLoading,
  setLoading,
  setCourseProgress,
  setLearningPathState,
  setLearningPathBlockState,
  setLearnDataTranslationContext,
}: UseLearnPageCourseDataParams) {
  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)

        const lessonId =
          currentLesson?.lesson_id || modules[0]?.lessons[0]?.lesson_id
        const learnData = await loadLearnData(
          `/api/courses/${slug}/learn-data${buildLearnDataQuery({
            lessonId,
            language: selectedLang,
            organizationId,
          })}`,
          { credentials: 'include' },
        )

        setLearningPathBlockState(null)

        if (learnData.course) {
          setCourse(learnData.course)

          const courseId = learnData.course.id || learnData.course.course_id
          if (courseId) {
            setWorkshopMetadata(null)
            void fetch(`/api/workshops/${courseId}/metadata`)
              .then(async (metadataResponse) => {
                if (!metadataResponse.ok) {
                  return
                }

                const metadataData =
                  (await metadataResponse.json()) as WorkshopMetadataResponse

                if (metadataData.success && metadataData.metadata) {
                  setWorkshopMetadata(
                    buildWorkshopMetadataContext({
                      metadata: metadataData.metadata,
                      slug,
                      userJobTitle,
                    }),
                  )
                }
              })
              .catch((error) => {
                if (process.env.NODE_ENV === 'development') {
                  console.warn(
                    'No se pudieron cargar metadatos del taller para LIA:',
                    error,
                  )
                }
              })
          }
        }

        if (learnData.modules) {
          setModules(learnData.modules)
          setCourseProgress(calculateCourseProgress(learnData.modules))
          setCurrentLesson(
            resolveCurrentLesson(
              learnData.modules,
              learnData.lastWatchedLessonId,
            ),
          )
        }

        if (learnData.notesStats) {
          applyServerNotesStats(learnData.notesStats)
        }

        setLearningPathState(learnData.learningPath ?? null)

        setLearnDataTranslationContext(learnData.translationContext ?? null)

        if (
          learnData.lastWatchedLessonId &&
          !lessonId &&
          learnData.modules?.length
        ) {
          dedupedFetch(
            `/api/courses/${slug}/learn-data${buildLearnDataQuery({
              lessonId: learnData.lastWatchedLessonId,
              language: selectedLang,
              organizationId,
            })}`,
            { credentials: 'include' },
          ).catch(() => null)
        }
      } catch (error) {
        if (
          error instanceof LearnDataRequestError &&
          error.status === 423 &&
          error.payload?.error === 'CURSO_BLOQUEADO_POR_LEARNING_PATH'
        ) {
          const blockedLearningPath = error.payload.learningPath ?? null
          setLearningPathState(blockedLearningPath)
          setLearningPathBlockState({
            message:
              error.payload.message ||
              'Este taller aun esta bloqueado dentro de su learning path.',
            learningPath: blockedLearningPath,
          })
          setCourse(null)
          setModules([])
          setCurrentLesson(null)
          setCourseProgress(0)
          setLearnDataTranslationContext(null)
          return
        }

        setCourse(null)
        setModules([])
        setCurrentLesson(null)
        setCourseProgress(0)
        setLearningPathState(null)
        setLearningPathBlockState(null)
        setLearnDataTranslationContext(null)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadCourse()
    }
  }, [
    organizationId,
    selectedLang,
    setCurrentLesson,
    setLearnDataTranslationContext,
    setLearningPathBlockState,
    setLearningPathState,
    setModules,
    setCourse,
    setCourseProgress,
    setLoading,
    slug,
  ])

  useEffect(() => {
    if (modules.length > 0 && notesStatsLessonsWithNotes === '0/0') {
      initializeNotesStats()
    }
  }, [initializeNotesStats, modules.length, notesStatsLessonsWithNotes])

  useEffect(() => {
    setLiaTranscript(null)
    setLiaSummary(null)
    setIsLiaTranscriptLoading(Boolean(currentLesson?.lesson_id && slug))
    setIsLiaSummaryLoading(Boolean(currentLesson?.lesson_id && slug))

    if (!currentLesson?.lesson_id || !slug) {
      setIsLiaTranscriptLoading(false)
      setIsLiaSummaryLoading(false)
      return
    }

    const abortController = new AbortController()

    const loadLiaContext = async () => {
      const supplementalQuery = new URLSearchParams({ language: selectedLang })
      if (organizationId) {
        supplementalQuery.set('orgId', organizationId)
      }

      const transcriptUrl = `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/transcript?${supplementalQuery.toString()}`
      const summaryUrl = `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/summary?${supplementalQuery.toString()}`

      const [transcriptResult, summaryResult] = await Promise.allSettled([
        loadLessonSupplement({
          url: transcriptUrl,
          contentKey: 'transcript_content',
          signal: abortController.signal,
        }),
        loadLessonSupplement({
          url: summaryUrl,
          contentKey: 'summary_content',
          signal: abortController.signal,
        }),
      ])

      if (abortController.signal.aborted) {
        return
      }

      if (transcriptResult.status === 'fulfilled') {
        setLiaTranscript(transcriptResult.value)
      } else if (
        process.env.NODE_ENV === 'development' &&
        transcriptResult.reason?.name !== 'AbortError'
      ) {
        console.warn(
          'Error loading transcript for lesson content:',
          transcriptResult.reason,
        )
      }

      if (summaryResult.status === 'fulfilled') {
        setLiaSummary(summaryResult.value)
      } else if (
        process.env.NODE_ENV === 'development' &&
        summaryResult.reason?.name !== 'AbortError'
      ) {
        console.warn(
          'Error loading summary for lesson content:',
          summaryResult.reason,
        )
      }

      setIsLiaTranscriptLoading(false)
      setIsLiaSummaryLoading(false)
    }

    const timer = setTimeout(() => {
      void loadLiaContext().catch((error) => {
        if (abortController.signal.aborted) {
          return
        }

        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading lesson support content:', error)
        }

        setIsLiaTranscriptLoading(false)
        setIsLiaSummaryLoading(false)
      })
    }, 1000)

    return () => {
      abortController.abort()
      clearTimeout(timer)
    }
  }, [currentLesson?.lesson_id, organizationId, selectedLang, slug])

  useEffect(() => {
    if (currentLesson && slug) {
      fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organizationId ? { organizationId } : {}),
        credentials: 'include',
      }).catch(() => null)
    }
  }, [currentLesson?.lesson_id, organizationId, slug])
}
