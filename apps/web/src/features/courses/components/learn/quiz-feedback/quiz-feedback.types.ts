import type { CourseLessonContext } from '@/core/types/lia.types'

export type QuizFeedbackRequest = {
  activityId?: string | null
  force?: boolean
  materialId?: string | null
  prompt: string
  courseContext?: CourseLessonContext | null
}

export type QuizFeedbackEntry = {
  content: string | null
  createdAt: string
  error: string | null
  isLoading: boolean
  prompt: string
  updatedAt: string
}

export type QuizFeedbackState = QuizFeedbackEntry & {
  activePrompt: string | null
  activePromptId: string | null
  isOpen: boolean
}
