import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import type { LearnLesson, LearnModule } from '../../components/learn/types'

interface UseLearnPageVideoCompletionParams {
  loadLessonActivitiesAndMaterials: (lessonId: string) => Promise<void>
  setCurrentLesson: Dispatch<SetStateAction<LearnLesson | null>>
  setModules: Dispatch<SetStateAction<LearnModule[]>>
}

export function useLearnPageVideoCompletion({
  loadLessonActivitiesAndMaterials,
  setCurrentLesson,
  setModules,
}: UseLearnPageVideoCompletionParams) {
  const [pendingVideoTransitionLessonId, setPendingVideoTransitionLessonId] =
    useState<string | null>(null)

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
    [loadLessonActivitiesAndMaterials, setCurrentLesson, setModules],
  )

  return {
    handleVideoCompleted,
    pendingVideoTransitionLessonId,
    setPendingVideoTransitionLessonId,
  }
}
