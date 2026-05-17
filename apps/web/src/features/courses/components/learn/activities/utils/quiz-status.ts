import type { LessonQuizStatus, LessonQuizStatusItem } from '../../types'

export function findQuizStatusItem(
  quizStatus: LessonQuizStatus | null,
  itemId: string,
  itemType: 'activity' | 'material',
): LessonQuizStatusItem | undefined {
  return quizStatus?.quizzes.find(
    (quiz: LessonQuizStatusItem) => quiz.id === itemId && quiz.type === itemType,
  )
}
