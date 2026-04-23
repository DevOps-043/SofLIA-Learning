import type { LessonContext } from './types'

export function buildLessonQuizSection(lessonContext: LessonContext): string {
  if (!lessonContext.quiz || !lessonContext.quiz.hasRequiredQuizzes) return ''

  let section = '\nQUIZZES REQUERIDOS EN ESTA LECCION:\n'
  section += `- Totales: ${lessonContext.quiz.totalRequiredQuizzes} | Completados: ${lessonContext.quiz.completedQuizzes} | Aprobados: ${lessonContext.quiz.passedQuizzes}\n`

  lessonContext.quiz.quizzes?.slice(0, 6).forEach((quiz) => {
    const status = quiz.isPassed
      ? 'aprobado'
      : quiz.isCompleted
        ? `completado (${quiz.percentage}%)`
        : 'pendiente'
    section += `- ${quiz.title} [${quiz.type}] - ${status}\n`
  })

  return section
}
