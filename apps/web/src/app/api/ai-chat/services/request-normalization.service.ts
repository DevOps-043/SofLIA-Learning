import type { CourseLessonContext } from '../../../../core/types/lia.types'
import {
  detectMessageLanguage,
  normalizeLanguage,
  type SupportedLanguage,
} from './language-detection.service'
import type { PageContext } from '../system-prompt.service'

export const MAX_MESSAGE_LENGTH = 50000
export const MAX_HISTORY_LENGTH = 20

export interface RequestUserInfo {
  display_name?: string
  first_name?: string
  last_name?: string
  username?: string
  type_rol?: string
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

export function normalizeAiChatRequest(
  requestBody: AiChatRequestBody
): { data?: NormalizedAiChatRequest; error?: RequestNormalizationError } {
  if (!requestBody.message || typeof requestBody.message !== 'string') {
    return {
      error: {
        error: 'El campo "message" es requerido y debe ser una cadena de texto',
        status: 400,
      },
    }
  }

  if (requestBody.message.length > MAX_MESSAGE_LENGTH) {
    return {
      error: {
        error: 'El mensaje es demasiado largo',
        message: `El mensaje excede el límite de ${MAX_MESSAGE_LENGTH} caracteres`,
        status: 400,
      },
    }
  }

  const conversationHistory = Array.isArray(requestBody.conversationHistory)
    ? requestBody.conversationHistory.slice(-MAX_HISTORY_LENGTH)
    : []

  return {
    data: {
      message: requestBody.message,
      context: requestBody.context || 'general',
      conversationHistory,
      userName: requestBody.userName,
      userInfo: requestBody.userInfo,
      courseContext: requestBody.courseContext,
      workshopContext: requestBody.workshopContext,
      pageContext: requestBody.pageContext,
      isSystemMessage: requestBody.isSystemMessage || false,
      conversationId: requestBody.conversationId,
      languageFromRequest: requestBody.language || 'es',
      isPromptMode: requestBody.isPromptMode || false,
    },
  }
}

export function resolveRequestLanguage(
  message: string,
  languageFromRequest: string
): SupportedLanguage {
  const detectedMessageLanguage = detectMessageLanguage(message)

  if (languageFromRequest && languageFromRequest !== 'es') {
    return normalizeLanguage(languageFromRequest)
  }

  if (detectedMessageLanguage !== 'es' && detectedMessageLanguage !== languageFromRequest) {
    return detectedMessageLanguage
  }

  return normalizeLanguage(languageFromRequest || 'es')
}
