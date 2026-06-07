'use client'

import { useEffect, type MutableRefObject } from 'react'

import {
  hasIncompleteActivities,
  isLessonVideoCompleted,
} from '../lessonNavigation.utils'
import type { LearnLesson, LearnTab } from '../../components/learn/types'
import type { LearnActivitySummary } from '../../components/learn/types'

interface UseLearnPageEffectsOptions {
  activeTab: LearnTab
  setActiveTab: (tab: LearnTab) => void
  closeLia: () => void
  setLiaInteractionBlocked: (isBlocked: boolean) => void
  currentActivityPrompts: string[]
  prevPromptsLengthRef: MutableRefObject<number>
  setIsPromptsCollapsed: (collapsed: boolean) => void
  setCurrentActivityPrompts: (prompts: string[]) => void
  currentLesson: LearnLesson | null
  lessonsActivities: Record<string, LearnActivitySummary[] | undefined>
  checkedAutoRedirectRef: MutableRefObject<string | null>
  pendingVideoTransitionLessonId: string | null
  setPendingVideoTransitionLessonId: (id: string | null) => void
  navigateToNextLesson: () => Promise<void>
}

/**
 * Centralizes the four side-effects that orchestrate the learn page's
 * tab-switching behavior:
 *
 *   1. Reset activity prompts when leaving the activities tab.
 *   2. Block LIA while the activities tab is active.
 *   3. Auto-collapse / expand prompts when their list changes.
 *   4. Auto-redirect to activities after the video reaches 100 %.
 *   5. Drain the pending-video-transition queue (jump to activities or
 *      the next lesson once we know what's left to do).
 *
 * Placed in a single hook because they all read the activeTab, the
 * current lesson and the lesson's activity list — wiring them in
 * separate hooks would force the orchestrator to pass the same
 * five-arg tuple five times.
 */
export function useLearnPageEffects({
  activeTab,
  setActiveTab,
  closeLia,
  setLiaInteractionBlocked,
  currentActivityPrompts,
  prevPromptsLengthRef,
  setIsPromptsCollapsed,
  setCurrentActivityPrompts,
  currentLesson,
  lessonsActivities,
  checkedAutoRedirectRef,
  pendingVideoTransitionLessonId,
  setPendingVideoTransitionLessonId,
  navigateToNextLesson,
}: UseLearnPageEffectsOptions): void {
  // 1. Reset prompts state when leaving 'activities'.
  useEffect(() => {
    if (activeTab !== 'activities') {
      setCurrentActivityPrompts([])
      setIsPromptsCollapsed(false)
      prevPromptsLengthRef.current = 0
    }
  }, [activeTab, prevPromptsLengthRef, setCurrentActivityPrompts, setIsPromptsCollapsed])

  // 2. Set LIA interaction blocked status when entering/leaving the activities tab.
  useEffect(() => {
    setLiaInteractionBlocked(activeTab === 'activities')
  }, [activeTab, setLiaInteractionBlocked])

  // 3. Auto-expand the prompts panel when a new prompt set arrives.
  useEffect(() => {
    const previousLength = prevPromptsLengthRef.current
    const currentLength = currentActivityPrompts.length
    if (previousLength === 0 && currentLength > 0) setIsPromptsCollapsed(false)
    prevPromptsLengthRef.current = currentLength
  }, [currentActivityPrompts.length, prevPromptsLengthRef, setIsPromptsCollapsed])

  // 4. One-shot auto-redirect to activities when the video is fully
  //    watched but pending work remains.  Guard with a ref so we only
  //    consider each lesson once.
  useEffect(() => {
    if (!currentLesson?.lesson_id) return
    const lessonId = currentLesson.lesson_id
    if (checkedAutoRedirectRef.current === lessonId) return

    const activitiesList = lessonsActivities[lessonId]
    if (activitiesList === undefined) return

    checkedAutoRedirectRef.current = lessonId
    if (activeTab !== 'video') return

    const videoFullyWatched = isLessonVideoCompleted(currentLesson)
    const hasPending = activitiesList.length > 0 && hasIncompleteActivities(activitiesList)
    if (videoFullyWatched && hasPending) setActiveTab('activities')
  }, [
    activeTab,
    currentLesson,
    lessonsActivities,
    setActiveTab,
    checkedAutoRedirectRef,
  ])

  // 5. Drain the pending video-transition queue after handleVideoCompleted.
  useEffect(() => {
    if (!pendingVideoTransitionLessonId || !currentLesson?.lesson_id) return

    if (pendingVideoTransitionLessonId !== currentLesson.lesson_id) {
      setPendingVideoTransitionLessonId(null)
      return
    }
    if (activeTab !== 'video') {
      setPendingVideoTransitionLessonId(null)
      return
    }

    const activitiesList = lessonsActivities[pendingVideoTransitionLessonId]
    if (activitiesList === undefined) return

    const hasPendingActivities = hasIncompleteActivities(activitiesList)
    setPendingVideoTransitionLessonId(null)

    if (hasPendingActivities) {
      setActiveTab('activities')
      return
    }
    void navigateToNextLesson()
  }, [
    activeTab,
    currentLesson?.lesson_id,
    lessonsActivities,
    navigateToNextLesson,
    pendingVideoTransitionLessonId,
    setActiveTab,
    setPendingVideoTransitionLessonId,
  ])
}
