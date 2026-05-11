import type { CourseLessonContext } from '../../../../core/types/lia.types'
import { z } from 'zod'
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

const conversationHistoryEntrySchema = z.object({
  role: z.string().trim().min(1),
  content: z.string(),
})

const requestUserInfoSchema = z.object({
  display_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  type_rol: z.string().optional(),
  job_title: z.string().optional(),
  job_description: z.string().optional(),
})

const aiChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  context: z.string().trim().min(1).optional(),
  conversationHistory: z.array(conversationHistoryEntrySchema).optional(),
  userName: z.string().optional(),
  userInfo: requestUserInfoSchema.optional(),
  courseContext: z
    .unknown()
    .optional()
    .transform((value) => value as CourseLessonContext | undefined),
  workshopContext: z
    .unknown()
    .optional()
    .transform((value) => value as CourseLessonContext | undefined),
  pageContext: z
    .unknown()
    .optional()
    .transform((value) => value as PageContext | undefined),
  isSystemMessage: z.boolean().optional(),
  conversationId: z.string().trim().min(1).optional(),
  language: z.string().trim().min(1).optional(),
  isPromptMode: z.boolean().optional(),
})

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
  requestBody: AiChatRequestBody,
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
        message: `El mensaje excede el limite de ${MAX_MESSAGE_LENGTH} caracteres`,
        status: 400,
      },
    }
  }

  const parsedRequest = aiChatRequestSchema.safeParse(requestBody)

  if (!parsedRequest.success) {
    const messageIssue = parsedRequest.error.issues.find(
      (issue) => issue.path[0] === 'message',
    )

    if (messageIssue) {
      return {
        error: {
          error: 'El campo "message" es requerido y debe ser una cadena de texto',
          status: 400,
        },
      }
    }

    return {
      error: {
        error: 'Payload invalido',
        message: parsedRequest.error.issues[0]?.message,
        status: 400,
      },
    }
  }

  const parsedData = parsedRequest.data
  const conversationHistory = Array.isArray(parsedData.conversationHistory)
    ? parsedData.conversationHistory.slice(-MAX_HISTORY_LENGTH)
    : []

  return {
    data: {
      message: parsedData.message,
      context: parsedData.context || 'general',
      conversationHistory,
      userName: parsedData.userName,
      userInfo: parsedData.userInfo,
      courseContext: parsedData.courseContext,
      workshopContext: parsedData.workshopContext,
      pageContext: parsedData.pageContext,
      isSystemMessage: parsedData.isSystemMessage || false,
      conversationId: parsedData.conversationId,
      languageFromRequest: parsedData.language || 'es',
      isPromptMode: parsedData.isPromptMode || false,
    },
  }
}

export function resolveRequestLanguage(
  message: string,
  languageFromRequest: string,
): SupportedLanguage {
  const detectedMessageLanguage = detectMessageLanguage(message)

  if (languageFromRequest && languageFromRequest !== 'es') {
    return normalizeLanguage(languageFromRequest)
  }

  if (
    detectedMessageLanguage !== 'es' &&
    detectedMessageLanguage !== languageFromRequest
  ) {
    return detectedMessageLanguage
  }

  return normalizeLanguage(languageFromRequest || 'es')
}
