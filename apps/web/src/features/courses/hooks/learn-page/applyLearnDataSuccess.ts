import {
  calculateCourseProgress,
  resolveCurrentLesson,
} from './learn-page.service'
import { prefetchLearnData } from './learn-data.api'
import { loadWorkshopMetadataContext } from './workshop-metadata.api'
import type {
  LearnDataResponse,
  UseLearnPageCourseDataParams,
} from './learn-data.types'

export async function applyLearnDataSuccess({
  learnData,
  lessonId,
  params,
}: {
  learnData: LearnDataResponse
  lessonId?: string | null
  params: UseLearnPageCourseDataParams
}) {
  params.setLearningPathBlockState(null)

  if (learnData.course) {
    params.setCourse(learnData.course)
    const courseId = learnData.course.id || learnData.course.course_id
    const metadataContext = courseId
      ? await loadWorkshopMetadataContext({
          courseId,
          slug: params.slug,
          userJobTitle: params.userJobTitle,
        })
      : null

    if (metadataContext) {
      params.setWorkshopMetadata(metadataContext)
    }
  }

  if (learnData.modules) {
    params.setModules(learnData.modules)
    params.setCourseProgress(calculateCourseProgress(learnData.modules))
    params.setCurrentLesson(
      resolveCurrentLesson(learnData.modules, learnData.lastWatchedLessonId),
    )
  }

  if (learnData.notesStats) {
    params.applyServerNotesStats(learnData.notesStats)
  }

  params.setLearningPathState(learnData.learningPath ?? null)
  params.setLearnDataTranslationContext(learnData.translationContext ?? null)

  if (learnData.lastWatchedLessonId && !lessonId && learnData.modules?.length) {
    void prefetchLearnData({
      lessonId: learnData.lastWatchedLessonId,
      language: params.selectedLang,
      organizationId: params.organizationId,
      slug: params.slug,
    })
  }
}
