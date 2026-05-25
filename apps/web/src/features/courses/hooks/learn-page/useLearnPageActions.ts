'use client'

import { useCallback } from 'react'

import { isLessonVideoCompleted } from '../lessonNavigation.utils'
import type {
  LearnLesson,
  LearnModule,
  LearnTab,
} from '../../components/learn/types'

interface ValidationModalArgs {
  title: string
  message: string
  type: 'video' | 'activities' | 'quiz'
  lessonId: string
  redirectTab: LearnTab
}

interface UseLearnPageActionsOptions {
  setModules: (updater: (prev: LearnModule[]) => LearnModule[]) => void
  setCurrentLesson: (updater: (prev: LearnLesson | null) => LearnLesson | null) => void
  setPendingVideoTransitionLessonId: (id: string | null) => void
  loadLessonActivitiesAndMaterials: (lessonId: string) => Promise<void> | void
  setFocusedActivityId: (id: string | null) => void
  setFocusedMaterialId: (id: string | null) => void
  setCurrentActivityPrompts: (prompts: string[]) => void
  currentLesson: LearnLesson | null
  canCompleteLesson: (lessonId: string) => boolean
  markLessonAsCompleted: (lessonId: string) => Promise<boolean>
  openCannotCompleteModal: () => void
  openCourseCompletedModal: () => void
  handleBaseTabChange: (tab: LearnTab) => Promise<void>
  openValidationModal: (args: ValidationModalArgs) => void
  trackUserAction: (action: string, payload?: Record<string, unknown>) => void
}

/**
 * Bundles the orchestrator's imperative actions: video-completed
 * handler that updates the lesson tree and triggers the post-video
 * transition; the tab-change guard that blocks 'activities' until the
 * video is done; the sidebar focus setter; the prompts-change relay;
 * and the "complete course" flow that surfaces the cannot-complete
 * modal or the celebratory modal.
 */
export function useLearnPageActions({
  setModules,
  setCurrentLesson,
  setPendingVideoTransitionLessonId,
  loadLessonActivitiesAndMaterials,
  setFocusedActivityId,
  setFocusedMaterialId,
  setCurrentActivityPrompts,
  currentLesson,
  canCompleteLesson,
  markLessonAsCompleted,
  openCannotCompleteModal,
  openCourseCompletedModal,
  handleBaseTabChange,
  openValidationModal,
  trackUserAction,
}: UseLearnPageActionsOptions) {
  const handleVideoCompleted = useCallback(
    (lessonId: string) => {
      setModules((prevModules) =>
        prevModules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.lesson_id === lessonId
              ? { ...lesson, progress_percentage: 100 }
              : lesson,
          ),
        })),
      )
      setCurrentLesson((prevLesson) =>
        prevLesson?.lesson_id === lessonId
          ? { ...prevLesson, progress_percentage: 100 }
          : prevLesson,
      )
      setPendingVideoTransitionLessonId(lessonId)
      void loadLessonActivitiesAndMaterials(lessonId)
    },
    [
      setModules,
      setCurrentLesson,
      setPendingVideoTransitionLessonId,
      loadLessonActivitiesAndMaterials,
    ],
  )

  const handleSidebarContentFocus = useCallback(
    (contentId: string, contentType: 'activity' | 'material' = 'activity') => {
      if (contentType === 'material') {
        setFocusedMaterialId(contentId)
        setFocusedActivityId(null)
        return
      }
      setFocusedActivityId(contentId)
      setFocusedMaterialId(null)
    },
    [setFocusedActivityId, setFocusedMaterialId],
  )

  const handlePromptsChange = useCallback(
    (prompts: string[]) => setCurrentActivityPrompts(prompts),
    [setCurrentActivityPrompts],
  )

  const handleTabChange = useCallback(
    async (newTab: LearnTab) => {
      if (newTab === 'activities' && currentLesson && !isLessonVideoCompleted(currentLesson)) {
        trackUserAction('attempted_activities_access_before_video_completed', {
          lessonId: currentLesson.lesson_id,
          lessonTitle: currentLesson.lesson_title,
        })
        openValidationModal({
          title: 'Finaliza el video para continuar',
          message: 'Por favor, finaliza el video antes de continuar con las actividades.',
          type: 'video',
          lessonId: currentLesson.lesson_id,
          redirectTab: 'video',
        })
        return
      }
      await handleBaseTabChange(newTab)
    },
    [currentLesson, handleBaseTabChange, openValidationModal, trackUserAction],
  )

  const completeCurrentCourse = useCallback(async () => {
    if (!currentLesson?.lesson_id) return

    if (!canCompleteLesson(currentLesson.lesson_id)) {
      openCannotCompleteModal()
      return
    }
    const success = await markLessonAsCompleted(currentLesson.lesson_id)
    if (success) openCourseCompletedModal()
  }, [
    canCompleteLesson,
    currentLesson?.lesson_id,
    markLessonAsCompleted,
    openCannotCompleteModal,
    openCourseCompletedModal,
  ])

  return {
    handleVideoCompleted,
    handleSidebarContentFocus,
    handlePromptsChange,
    handleTabChange,
    completeCurrentCourse,
  }
}
