'use client'

import { useCallback, useMemo } from 'react'
import type { TFunction } from 'i18next'

import {
  canCompleteOrderedLesson,
  findOrderedLessonIndex,
  getOrderedLessons,
} from '../lessonNavigation.utils'
import type { LearnLesson, LearnModule } from '../../components/learn/types'

interface UseLearnPageTabsOptions {
  t: TFunction
  modules: LearnModule[]
  currentLesson: LearnLesson | null
}

/**
 * Memoised derivations the orchestrator would otherwise compute inline:
 * the localised tab list, the flattened ordered-lessons array, the
 * current lesson's index inside that array, and a per-lesson
 * canComplete predicate.
 */
export function useLearnPageTabs({
  t,
  modules,
  currentLesson,
}: UseLearnPageTabsOptions) {
  const tabs = useMemo(
    () => [
      { id: 'video' as const, label: t('tabs.video'), icon: 'Play' },
      { id: 'activities' as const, label: t('tabs.activities'), icon: 'Activity' },
      { id: 'questions' as const, label: t('tabs.questions'), icon: 'MessageCircle' },
    ],
    [t],
  )

  const orderedLessons = useMemo(() => getOrderedLessons(modules), [modules])

  const currentLessonIndex = useMemo(
    () => findOrderedLessonIndex(orderedLessons, currentLesson?.lesson_id),
    [orderedLessons, currentLesson?.lesson_id],
  )

  const canCompleteLesson = useCallback(
    (lessonId: string) => canCompleteOrderedLesson(orderedLessons, lessonId),
    [orderedLessons],
  )

  return { tabs, orderedLessons, currentLessonIndex, canCompleteLesson }
}
