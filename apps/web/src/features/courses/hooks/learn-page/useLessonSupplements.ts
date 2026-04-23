import { useEffect } from 'react'

import { loadLessonSupplement } from './lesson-supplement.api'
import { buildLessonSupplementUrls } from './lesson-supplement.urls'
import type { UseLearnPageCourseDataParams } from './learn-data.types'

const LESSON_SUPPLEMENT_DELAY_MS = 1000

export function useLessonSupplements({
  currentLesson,
  organizationId,
  selectedLang,
  setIsLiaSummaryLoading,
  setIsLiaTranscriptLoading,
  setLiaSummary,
  setLiaTranscript,
  slug,
}: UseLearnPageCourseDataParams) {
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
    const { summaryUrl, transcriptUrl } = buildLessonSupplementUrls({
      lessonId: currentLesson.lesson_id,
      organizationId,
      selectedLang,
      slug,
    })

    const loadLiaContext = async () => {
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
      }

      if (summaryResult.status === 'fulfilled') {
        setLiaSummary(summaryResult.value)
      }

      setIsLiaTranscriptLoading(false)
      setIsLiaSummaryLoading(false)
    }

    const timer = setTimeout(() => {
      void loadLiaContext().catch((error) => {
        if (!abortController.signal.aborted) {
          console.warn('Error loading lesson support content:', error)
          setIsLiaTranscriptLoading(false)
          setIsLiaSummaryLoading(false)
        }
      })
    }, LESSON_SUPPLEMENT_DELAY_MS)

    return () => {
      abortController.abort()
      clearTimeout(timer)
    }
  }, [currentLesson?.lesson_id, organizationId, selectedLang, slug])
}
