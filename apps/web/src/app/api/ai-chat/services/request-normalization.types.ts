import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type { PageContext } from '../system-prompt.service'

export interface RequestUserInfo {
  display_name?: string
  first_name?: string
  last_name?: string
  username?: string
  type_rol?: string
  job_title?: string
  job_description?: string
}

export interface AiChatRequestBody {
  message: string
  context?: string
  conversationHistory?: Array<{ role: string; content: string }>
  userName?: string
  userInfo?: RequestUserInfo
  courseContext?: CourseLessonContext
  workshopContext?: CourseLessonContext
  pageContext?: PageContext
  isSystemMessage?: boolean
  conversationId?: string
  language?: string
  isPromptMode?: boolean
}

export interface NormalizedAiChatRequest {
  message: string
  context: string
  conversationHistory: Array<{ role: string; content: string }>
  userName?: string
  userInfo?: RequestUserInfo
  courseContext?: CourseLessonContext
  workshopContext?: CourseLessonContext
  pageContext?: PageContext
  isSystemMessage: boolean
  conversationId?: string
  languageFromRequest: string
  isPromptMode: boolean
}

export interface RequestNormalizationError {
  error: string
  message?: string
  status: number
}
