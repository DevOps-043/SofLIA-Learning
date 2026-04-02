'use client'

import { useEffect } from 'react'
import { dedupedFetch } from '../../../../lib/supabase/request-deduplication'
import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnCourseData,
  LearnLesson,
  LearnModule,
  LearnNotesStats,
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
}

interface WorkshopMetadataResponse {
  success?: boolean
  metadata?: WorkshopMetadataPayload
}

interface UseLearnPageCourseDataParams {
  slug: string
  selectedLang: string
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
  setLoading: (loading: boolean) => void
  setCourseProgress: (progress: number) => void
}

export function useLearnPageCourseData({
  slug,
  selectedLang,
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
  setLoading,
  setCourseProgress,
}: UseLearnPageCourseDataParams) {
  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)

        const lessonId =
          currentLesson?.lesson_id || modules[0]?.lessons[0]?.lesson_id
        const learnData = (await dedupedFetch(
          `/api/courses/${slug}/learn-data${buildLearnDataQuery({
            lessonId,
            language: selectedLang,
          })}`,
          { credentials: 'include' },
        )) as LearnDataResponse

        if (learnData.course) {
          setCourse(learnData.course)

          const courseId = learnData.course.id || learnData.course.course_id
          if (courseId) {
            try {
              const metadataResponse = await fetch(
                `/api/workshops/${courseId}/metadata`,
              )

              if (metadataResponse.ok) {
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
              }
            } catch (error) {
              console.warn(
                'No se pudieron cargar metadatos del taller para LIA:',
                error,
              )
            }
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

        if (
          learnData.lastWatchedLessonId &&
          !lessonId &&
          learnData.modules?.length
        ) {
          dedupedFetch(
            `/api/courses/${slug}/learn-data?lessonId=${learnData.lastWatchedLessonId}`,
            { credentials: 'include' },
          ).catch(() => null)
        }
      } catch {
        setCourse(null)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadCourse()
    }
  }, [slug, selectedLang])

  useEffect(() => {
    if (modules.length > 0 && notesStatsLessonsWithNotes === '0/0') {
      initializeNotesStats()
    }
  }, [initializeNotesStats, modules.length, notesStatsLessonsWithNotes])

  useEffect(() => {
    setLiaTranscript(null)
    setLiaSummary(null)

    if (!currentLesson?.lesson_id || !slug) {
      return
    }

    const loadLiaContext = async () => {
      try {
        const transcriptResponse = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/transcript?language=${selectedLang}`,
          { credentials: 'include' },
        )

        if (transcriptResponse.ok) {
          const transcriptData = (await transcriptResponse.json()) as {
            transcript_content?: string
          }

          if (transcriptData.transcript_content) {
            setLiaTranscript(transcriptData.transcript_content)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading transcript for LIA:', error)
        }
      }

      try {
        const summaryResponse = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/summary?language=${selectedLang}`,
          { credentials: 'include' },
        )

        if (summaryResponse.ok) {
          const summaryData = (await summaryResponse.json()) as {
            summary_content?: string
          }

          if (summaryData.summary_content) {
            setLiaSummary(summaryData.summary_content)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading summary for LIA:', error)
        }
      }
    }

    const timer = setTimeout(loadLiaContext, 1000)
    return () => clearTimeout(timer)
  }, [currentLesson?.lesson_id, selectedLang, slug])

  useEffect(() => {
    if (currentLesson && slug) {
      fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).catch(() => null)
    }
  }, [currentLesson?.lesson_id, slug])
}
