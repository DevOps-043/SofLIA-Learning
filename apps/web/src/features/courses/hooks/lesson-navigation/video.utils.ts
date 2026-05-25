import type { LearnLesson } from '../../components/learn/types'

export const LESSON_VIDEO_COMPLETION_THRESHOLD_PERCENT = 95

export function hasLessonVideo(lesson?: LearnLesson | null): boolean {
  return Boolean(lesson?.video_provider && lesson.video_provider_id)
}

export function isLessonVideoCompleted(lesson?: LearnLesson | null): boolean {
  if (!lesson) {
    return false
  }

  if (!hasLessonVideo(lesson)) {
    return true
  }

  return (
    Boolean(lesson.is_completed) ||
    (lesson.progress_percentage ?? 0) >= LESSON_VIDEO_COMPLETION_THRESHOLD_PERCENT
  )
}

export function shouldBlockLessonVideoAdvance(lesson?: LearnLesson | null): boolean {
  return hasLessonVideo(lesson) && !isLessonVideoCompleted(lesson)
}
