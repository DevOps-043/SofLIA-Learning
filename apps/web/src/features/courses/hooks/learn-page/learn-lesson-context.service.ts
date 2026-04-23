import type { CourseLessonContext } from '../../../../core/types/lia.types'
import { buildActivitiesContext } from './lesson-activities-context.service'
import { buildLearnLessonBaseContext } from './learn-lesson-base-context.service'
import { buildLearningProgressContext } from './lesson-learning-progress-context.service'
import { buildMaterialsContext } from './lesson-materials-context.service'
import { buildQuizContext } from './lesson-quiz-context.service'
import type { BuildLearnLessonContextParams } from './learn-lesson-context.types'

export function buildLearnLessonContext(
  params: BuildLearnLessonContextParams,
): CourseLessonContext | undefined {
  const baseContext = buildLearnLessonBaseContext(params)

  if (!baseContext || !params.currentLesson) {
    return undefined
  }

  return {
    ...baseContext,
    transcriptContent: params.transcriptContent || undefined,
    summaryContent: params.summaryContent || undefined,
    currentPage: params.currentPage,
    currentTab: params.activeTab,
    activitiesContext: buildActivitiesContext({
      currentActivities: params.currentActivities,
      activeTab: params.activeTab,
      currentActivityPrompts: params.currentActivityPrompts,
    }),
    materialsContext: buildMaterialsContext(params.currentMaterials),
    quizContext: buildQuizContext(params.quizStatus),
    learningProgressContext: buildLearningProgressContext({
      modules: params.modules,
      currentLesson: params.currentLesson,
      activeTab: params.activeTab,
    }),
  }
}
