'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback } from 'react'

import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnActivitySummary,
  LearnCourseData,
  LearnLesson,
  LearnMaterialSummary,
  LearnModule,
  LearnTab,
  LessonQuizStatus,
} from '../../components/learn/types'
import { buildLearnLessonContext } from './learn-page.service'

interface LiaChatLike {
  sendMessage: (
    message: string,
    courseContext?: CourseLessonContext,
    workshopContext?: CourseLessonContext,
    isSystemMessage?: boolean,
  ) => Promise<void>
}

interface UseLearnPageLiaIntegrationOptions {
  liaChat: LiaChatLike | null
  isLiaOpen: boolean
  isLiaInteractionBlocked: boolean
  openLia: () => void
  closeLia: () => void
  openLiaNoteModal: (content: string) => void
  course: LearnCourseData | null
  currentLesson: LearnLesson | null
  modules: LearnModule[]
  workshopMetadata: CourseLessonContext | null
  slug: string
  userJobTitle: string | undefined
  liaTranscript: string | null
  liaSummary: string | null
  activeTab: LearnTab
  lessonsActivities: Record<string, LearnActivitySummary[] | undefined>
  lessonsMaterials: Record<string, LearnMaterialSummary[] | undefined>
  lessonsQuizStatus: Record<string, LessonQuizStatus | null | undefined>
  currentActivityPrompts: string[]
}

/**
 * Bridges the learn page with the LIA assistant: send-message helper
 * (with auto-open and interaction-blocked guards), context-builder for
 * lesson prompts, and the save-as-note shortcut.
 *
 * Keeping these together avoids three near-identical "depends on
 * currentLesson + modules + workshopMetadata" closures in the
 * orchestrator.
 */
export function useLearnPageLiaIntegration({
  liaChat,
  isLiaOpen,
  isLiaInteractionBlocked,
  openLia,
  closeLia,
  openLiaNoteModal,
  course,
  currentLesson,
  modules,
  workshopMetadata,
  slug,
  userJobTitle,
  liaTranscript,
  liaSummary,
  activeTab,
  lessonsActivities,
  lessonsMaterials,
  lessonsQuizStatus,
  currentActivityPrompts,
}: UseLearnPageLiaIntegrationOptions) {
  const sendLiaMessage = useCallback(
    async (
      message: string,
      courseContext?: CourseLessonContext,
      workshopContext?: CourseLessonContext,
      isSystemMessage: boolean = false,
    ) => {
      if (!liaChat?.sendMessage) {
        techDebtLogger.warn('LIA Chat no inicializado')
        return
      }
      if (isLiaInteractionBlocked) {
        closeLia()
        return
      }
      if (!isLiaOpen) openLia()
      await liaChat.sendMessage(message, courseContext, workshopContext, isSystemMessage)
    },
    [closeLia, isLiaInteractionBlocked, isLiaOpen, liaChat, openLia],
  )

  const handleSaveLiaNote = useCallback(
    (content: string) => openLiaNoteModal(content),
    [openLiaNoteModal],
  )

  const getLessonContext = useCallback(() => {
    const lessonId = currentLesson?.lesson_id
    return buildLearnLessonContext({
      course,
      currentLesson,
      modules,
      workshopMetadata,
      slug,
      userJobTitle,
      transcriptContent: liaTranscript,
      summaryContent: liaSummary,
      activeTab,
      currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
      currentActivities: lessonId ? lessonsActivities[lessonId] : undefined,
      currentMaterials: lessonId ? lessonsMaterials[lessonId] : undefined,
      quizStatus: lessonId ? lessonsQuizStatus[lessonId] : undefined,
      currentActivityPrompts,
    })
  }, [
    activeTab,
    course,
    currentActivityPrompts,
    currentLesson,
    liaSummary,
    liaTranscript,
    lessonsActivities,
    lessonsMaterials,
    lessonsQuizStatus,
    modules,
    slug,
    userJobTitle,
    workshopMetadata,
  ])

  return { sendLiaMessage, handleSaveLiaNote, getLessonContext }
}
