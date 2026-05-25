import { LessonProgressRecord } from './lesson-progress-record'

export function isLessonCompleted(progress: LessonProgressRecord): boolean {
  return Boolean(progress.is_completed || progress.lesson_status === 'completed')
}
