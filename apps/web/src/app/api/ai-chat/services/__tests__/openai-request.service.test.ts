import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateAiChatResponse, shouldUseGeminiForContext } from '../openai-request.service'
import {
  callGemini,
  callOpenAI,
  generateAIResponse,
} from '../../ai-provider.service'

vi.mock('../../ai-provider.service', () => ({
  callGemini: vi.fn(),
  callOpenAI: vi.fn(),
  generateAIResponse: vi.fn(),
}))

describe('openai-request.service', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('uses Gemini for supported contexts when both providers are configured', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
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
      hasCourseContext: false,
    })

    expect(callGemini).toHaveBeenCalledOnce()
    expect(callOpenAI).not.toHaveBeenCalled()
    expect(result.response).toBe('respuesta gemini')
  })

  it('falls back when OPENAI is not configured', async () => {
    delete process.env.OPENAI_API_KEY
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
    process.env.OPENAI_API_KEY = 'openai-key'
    vi.mocked(callOpenAI).mockRejectedValue(new Error('provider error'))
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

    expect(callOpenAI).toHaveBeenCalledOnce()
    expect(generateAIResponse).toHaveBeenCalledOnce()
    expect(result.response).toBe('respuesta fallback')
  })

  it('detects contexts that should use Gemini', () => {
    expect(shouldUseGeminiForContext('study-planner', 'google-key')).toBe(true)
    expect(shouldUseGeminiForContext('onboarding', 'google-key')).toBe(false)
    expect(shouldUseGeminiForContext('study-planner', '')).toBe(false)
  })
})
