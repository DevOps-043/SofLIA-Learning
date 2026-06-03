import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateAiChatResponse, shouldUseGeminiForContext } from '../gemini-request.service'
import {
  callGemini,
  generateAIResponse,
} from '../../ai-provider.service'

vi.mock('../../ai-provider.service', () => ({
  callGemini: vi.fn(),
  generateAIResponse: vi.fn(),
}))

describe('gemini-request.service', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('uses Gemini for any chat context when Gemini is configured', async () => {
    process.env.GOOGLE_API_KEY = 'google-key'
    vi.mocked(callGemini).mockResolvedValue({ response: 'respuesta gemini' })

    const result = await generateAiChatResponse({
      message: 'hola',
      context: 'study-planner',
      language: 'es',
      contextPrompt: 'prompt',
      conversationHistory: [],
      userId: 'user-1',
      isSystemMessage: false,
      hasCourseContext: true,
    })

    expect(callGemini).toHaveBeenCalledOnce()
    expect(result.response).toBe('respuesta gemini')
  })

  it('falls back when Gemini is not configured', async () => {
    delete process.env.GOOGLE_API_KEY
    delete process.env.GEMINI_API_KEY
    vi.mocked(generateAIResponse).mockReturnValue('respuesta fallback')

    const result = await generateAiChatResponse({
      message: 'hola',
      context: 'general',
      language: 'es',
      contextPrompt: 'prompt',
      conversationHistory: [],
      userId: null,
      isSystemMessage: false,
      hasCourseContext: false,
    })

    expect(generateAIResponse).toHaveBeenCalledOnce()
    expect(result.response).toBe('respuesta fallback')
  })

  it('uses fallback when provider request throws', async () => {
    process.env.GOOGLE_API_KEY = 'google-key'
    vi.mocked(callGemini).mockRejectedValue(new Error('provider error'))
    vi.mocked(generateAIResponse).mockReturnValue('respuesta fallback')

    const result = await generateAiChatResponse({
      message: 'hola',
      context: 'general',
      language: 'es',
      contextPrompt: 'prompt',
      conversationHistory: [],
      userId: null,
      isSystemMessage: false,
      hasCourseContext: false,
    })

    expect(callGemini).toHaveBeenCalledOnce()
    expect(generateAIResponse).toHaveBeenCalledOnce()
    expect(result.response).toBe('respuesta fallback')
  })

  it('uses Gemini for every context when an API key exists', () => {
    expect(shouldUseGeminiForContext('study-planner', 'google-key')).toBe(true)
    expect(shouldUseGeminiForContext('onboarding', 'google-key')).toBe(true)
    expect(shouldUseGeminiForContext('general', 'google-key')).toBe(true)
    expect(shouldUseGeminiForContext('study-planner', '')).toBe(false)
  })
})
