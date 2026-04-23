'use client'

import { useMemo, useState } from 'react'

import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnCourseData,
  LearnLesson,
  LearnModule,
  LearnPathBlockState,
  LearnPathState,
  LearnTranslationContext,
} from '../../components/learn/types'

/**
 * Holds all mutable state for the course learning page.
 *
 * Organized by domain:
 * - Course data: course, modules, currentLesson, workshopMetadata
 * - LIA assistant: liaTranscript, liaSummary, loading flags
 * - Learning path: learningPathState, learningPathBlockState
 * - i18n: learnDataTranslationContext
 * - Progress: courseProgress
 *
 * `courseDataSetters` is a memoized object of all setters, passed to
 * `useLearnPageDataLoader` to avoid prop-drilling individual setters.
 *
 * Side effects: none. Pure state container — no API calls, no subscriptions.
 */
export function useLearnPageState() {
  const [course, setCourse] = useState<LearnCourseData | null>(null)
  const [modules, setModules] = useState<LearnModule[]>([])
  const [currentLesson, setCurrentLesson] = useState<LearnLesson | null>(null)
  const [workshopMetadata, setWorkshopMetadata] =
    useState<CourseLessonContext | null>(null)
  const [liaTranscript, setLiaTranscript] = useState<string | null>(null)
  const [liaSummary, setLiaSummary] = useState<string | null>(null)
  const [learningPathState, setLearningPathState] =
    useState<LearnPathState | null>(null)
  const [learningPathBlockState, setLearningPathBlockState] =
    useState<LearnPathBlockState | null>(null)
  const [learnDataTranslationContext, setLearnDataTranslationContext] =
    useState<LearnTranslationContext | null>(null)
  const [isLiaTranscriptLoading, setIsLiaTranscriptLoading] = useState(false)
  const [isLiaSummaryLoading, setIsLiaSummaryLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [courseProgress, setCourseProgress] = useState(0)

  const courseDataSetters = useMemo(
    () => ({
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
    }),
    [],
  )

  return {
    course,
    modules,
    currentLesson,
    setCurrentLesson,
    setModules,
    workshopMetadata,
    learningPathState,
    learningPathBlockState,
    loading,
    courseProgress,
    liaTranscript,
    liaSummary,
    isLiaTranscriptLoading,
    isLiaSummaryLoading,
    learnDataTranslationContext,
    setCourseProgress,
    courseDataSetters,
  }
}
