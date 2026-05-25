'use client'

import { useEffect, useRef, useState } from 'react'

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
 * Owns every piece of primitive React state the learn page orchestrator
 * needs.  Grouping them here keeps the orchestrator's body short and
 * makes it obvious which pieces are local vs. derived from sub-hooks.
 *
 * The "mounted" flag flips on first effect — used by SSR-sensitive
 * children that should only render after hydration.
 */
export function useLearnPageLocalState() {
  const [mounted, setMounted] = useState(false)
  const [course, setCourse] = useState<LearnCourseData | null>(null)
  const [modules, setModules] = useState<LearnModule[]>([])
  const [currentLesson, setCurrentLesson] = useState<LearnLesson | null>(null)
  const [workshopMetadata, setWorkshopMetadata] = useState<CourseLessonContext | null>(null)
  const [liaTranscript, setLiaTranscript] = useState<string | null>(null)
  const [liaSummary, setLiaSummary] = useState<string | null>(null)
  const [learningPathState, setLearningPathState] = useState<LearnPathState | null>(null)
  const [learningPathBlockState, setLearningPathBlockState] =
    useState<LearnPathBlockState | null>(null)
  const [learnDataTranslationContext, setLearnDataTranslationContext] =
    useState<LearnTranslationContext | null>(null)
  const [isLiaTranscriptLoading, setIsLiaTranscriptLoading] = useState(false)
  const [isLiaSummaryLoading, setIsLiaSummaryLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [courseProgress, setCourseProgress] = useState(6)
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false)
  const [currentActivityPrompts, setCurrentActivityPrompts] = useState<string[]>([])
  const [isPromptsCollapsed, setIsPromptsCollapsed] = useState(false)
  const [focusedActivityId, setFocusedActivityId] = useState<string | null>(null)
  const [focusedMaterialId, setFocusedMaterialId] = useState<string | null>(null)
  const [pendingVideoTransitionLessonId, setPendingVideoTransitionLessonId] = useState<
    string | null
  >(null)

  const prevPromptsLengthRef = useRef<number>(0)
  const checkedAutoRedirectRef = useRef<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  return {
    mounted,
    course, setCourse,
    modules, setModules,
    currentLesson, setCurrentLesson,
    workshopMetadata, setWorkshopMetadata,
    liaTranscript, setLiaTranscript,
    liaSummary, setLiaSummary,
    learningPathState, setLearningPathState,
    learningPathBlockState, setLearningPathBlockState,
    learnDataTranslationContext, setLearnDataTranslationContext,
    isLiaTranscriptLoading, setIsLiaTranscriptLoading,
    isLiaSummaryLoading, setIsLiaSummaryLoading,
    loading, setLoading,
    courseProgress, setCourseProgress,
    isClearHistoryModalOpen, setIsClearHistoryModalOpen,
    currentActivityPrompts, setCurrentActivityPrompts,
    isPromptsCollapsed, setIsPromptsCollapsed,
    focusedActivityId, setFocusedActivityId,
    focusedMaterialId, setFocusedMaterialId,
    pendingVideoTransitionLessonId, setPendingVideoTransitionLessonId,
    prevPromptsLengthRef,
    checkedAutoRedirectRef,
  }
}

export type LearnPageLocalState = ReturnType<typeof useLearnPageLocalState>
