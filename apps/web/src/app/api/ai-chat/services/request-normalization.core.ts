import {
  MAX_HISTORY_LENGTH,
  MAX_MESSAGE_LENGTH,
} from './request-normalization.constants'
import { aiChatRequestSchema } from './request-normalization.schema'
import type {
  AiChatRequestBody,
  NormalizedAiChatRequest,
  RequestNormalizationError,
} from './request-normalization.types'

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

    return {
      error: messageIssue
        ? {
            error: 'El campo "message" es requerido y debe ser una cadena de texto',
            status: 400,
          }
        : {
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
