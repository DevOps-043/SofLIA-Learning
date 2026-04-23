import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type { LessonQuizStatus } from '../../components/learn/types'

export function buildQuizContext(
  quizStatus?: LessonQuizStatus | null,
): CourseLessonContext['quizContext'] {
  if (quizStatus === undefined) {
    return undefined
  }

  if (!quizStatus) {
    return {
      hasRequiredQuizzes: false,
      totalRequiredQuizzes: 0,
      completedQuizzes: 0,
      passedQuizzes: 0,
      allQuizzesPassed: true,
      quizzes: [],
    }
  }

  return {
    hasRequiredQuizzes: quizStatus.hasRequiredQuizzes,
    totalRequiredQuizzes: quizStatus.totalRequiredQuizzes,
    completedQuizzes: quizStatus.completedQuizzes,
    passedQuizzes: quizStatus.passedQuizzes,
    allQuizzesPassed: quizStatus.allQuizzesPassed,
    quizzes: quizStatus.quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      type: quiz.type,
      isCompleted: quiz.isCompleted,
      isPassed: quiz.isPassed,
      percentage: quiz.percentage,
    })),
  }
}
