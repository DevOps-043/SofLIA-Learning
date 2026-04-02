import { describe, expect, it } from 'vitest'
import {
  normalizeAiChatRequest,
  resolveRequestLanguage,
} from '../request-normalization.service'

describe('request-normalization.service', () => {
  it('normalizes request payloads and trims conversation history', () => {
    const history = Array.from({ length: 25 }, (_, index) => ({
      role: 'user',
      content: `message-${index}`,
    }))

    const result = normalizeAiChatRequest({
      message: 'hola',
      conversationHistory: history,
      context: 'general',
    })

    expect(result.error).toBeUndefined()
    expect(result.data?.conversationHistory).toHaveLength(20)
    expect(result.data?.conversationHistory[0]?.content).toBe('message-5')
  })

  it('rejects invalid messages early', () => {
    expect(normalizeAiChatRequest({ message: '' }).error).toEqual({
      error: 'El campo "message" es requerido y debe ser una cadena de texto',
      status: 400,
    })
  })

  it('prioritizes the request language when it is explicitly non-spanish', () => {
    expect(resolveRequestLanguage('hola', 'en')).toBe('en')
  })
})
