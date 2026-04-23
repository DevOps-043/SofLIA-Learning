import { useEffect } from 'react'

import { applyLearnDataSuccess } from './applyLearnDataSuccess'
import { buildLearnDataUrl, loadLearnData } from './learn-data.api'
import { handleLearnDataError } from './handleLearnDataError'
import type { UseLearnPageCourseDataParams } from './learn-data.types'

export function useCourseLearnDataEffect(params: UseLearnPageCourseDataParams) {
  const {
    currentLesson,
    modules,
    organizationId,
    selectedLang,
    setLoading,
    slug,
  } = params

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)

        const lessonId =
          currentLesson?.lesson_id || modules[0]?.lessons[0]?.lesson_id
        const learnData = await loadLearnData(
          buildLearnDataUrl({
            lessonId,
            language: selectedLang,
            organizationId,
            slug,
          }),
          { credentials: 'include' },
        )

        await applyLearnDataSuccess({ learnData, lessonId, params })
      } catch (error) {
        handleLearnDataError(error, params)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      void loadCourse()
    }
  }, [
    organizationId,
    params.setCourse,
    params.setCourseProgress,
    params.setCurrentLesson,
    params.setLearnDataTranslationContext,
    params.setLearningPathBlockState,
    params.setLearningPathState,
    params.setModules,
    selectedLang,
    setLoading,
    slug,
  ])
}
