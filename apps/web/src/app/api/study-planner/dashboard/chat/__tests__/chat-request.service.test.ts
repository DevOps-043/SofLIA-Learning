import { describe, expect, it } from 'vitest'
import {
  buildGeminiChatHistory,
  parseDashboardChatRequest,
} from '../chat-request.service'

describe('chat-request.service', () => {
  it('rejects empty user messages outside proactive mode', () => {
    const result = parseDashboardChatRequest({
      message: '   ',
      trigger: 'user_message',
    })

    expect(result.error).toEqual({
      error: 'String must contain at least 1 character(s)',
      status: 400,
    })
  })

  it('accepts proactive init without message', () => {
    const result = parseDashboardChatRequest({
      trigger: 'proactive_init',
    })

    expect(result.error).toBeUndefined()
    expect(result.data?.isProactiveInit).toBe(true)
  })

  it('builds Gemini history with the last ten messages and removes leading model messages', () => {
    const history = [
      { role: 'assistant' as const, content: 'assistant-0' },
      ...Array.from({ length: 11 }, (_, index) => ({
        role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `message-${index + 1}`,
      })),
    ]

    const result = buildGeminiChatHistory(history)

    expect(result).toHaveLength(9)
    expect(result[0]?.role).toBe('user')
    expect(result.at(-1)?.parts[0]?.text).toBe('message-11')
  })
})
