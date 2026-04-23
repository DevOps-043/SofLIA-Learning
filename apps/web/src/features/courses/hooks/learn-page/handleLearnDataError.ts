import {
  LearnDataRequestError,
  type UseLearnPageCourseDataParams,
} from './learn-data.types'

function clearCourseState(params: UseLearnPageCourseDataParams) {
  params.setCourse(null)
  params.setModules([])
  params.setCurrentLesson(null)
  params.setCourseProgress(0)
  params.setLearnDataTranslationContext(null)
}

export function handleLearnDataError(
  error: unknown,
  params: UseLearnPageCourseDataParams,
) {
  if (
    error instanceof LearnDataRequestError &&
    error.status === 423 &&
    error.payload?.error === 'CURSO_BLOQUEADO_POR_LEARNING_PATH'
  ) {
    const blockedLearningPath = error.payload.learningPath ?? null
    params.setLearningPathState(blockedLearningPath)
    params.setLearningPathBlockState({
      message:
        error.payload.message ||
        'Este taller aun esta bloqueado dentro de su learning path.',
      learningPath: blockedLearningPath,
    })
    clearCourseState(params)
    return
  }

  clearCourseState(params)
  params.setLearningPathState(null)
  params.setLearningPathBlockState(null)
}
