import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnLesson,
  LearnModule,
  LearnTab,
} from '../../components/learn/types'
import { resolveVerifiedLessonDurationMinutes } from './lesson-duration.service'

export function buildLearningProgressContext(params: {
  activeTab?: LearnTab
  currentLesson: LearnLesson
  modules: LearnModule[]
}): CourseLessonContext['learningProgressContext'] {
  const { activeTab, currentLesson, modules } = params
  const allLessons = modules.flatMap((module) => module.lessons)
  const currentLessonIndex = allLessons.findIndex(
    (lesson) => lesson.lesson_id === currentLesson.lesson_id,
  )
  const verifiedLessonDurationMinutes =
    resolveVerifiedLessonDurationMinutes(currentLesson)

  return {
    currentLessonNumber: currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1,
    totalLessons: allLessons.length,
    progressPercentage:
      allLessons.length > 0 && currentLessonIndex >= 0
        ? Math.round(((currentLessonIndex + 1) / allLessons.length) * 100)
        : 0,
    currentTab: activeTab || 'video',
    timeInCurrentLesson: verifiedLessonDurationMinutes
      ? `${verifiedLessonDurationMinutes} minutos`
      : 'Desconocido',
  }
}
