import { useCallback, useMemo } from 'react'

import {
  canCompleteOrderedLesson,
  findOrderedLessonIndex,
  getOrderedLessons,
} from '../lessonNavigation.utils'
import type { LearnLesson, LearnModule } from '../../components/learn/types'

export function useLearnPageOrderedLessons(
  modules: LearnModule[],
  currentLesson: LearnLesson | null,
) {
  const orderedLessons = useMemo(() => getOrderedLessons(modules), [modules])
  const currentLessonIndex = useMemo(
    () => findOrderedLessonIndex(orderedLessons, currentLesson?.lesson_id),
    [orderedLessons, currentLesson?.lesson_id],
  )
  const canCompleteLesson = useCallback(
    (lessonId: string) => canCompleteOrderedLesson(orderedLessons, lessonId),
    [orderedLessons],
  )

  return {
    orderedLessons,
    currentLessonIndex,
    canCompleteLesson,
  }
}
