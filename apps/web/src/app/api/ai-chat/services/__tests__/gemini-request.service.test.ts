import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateAiChatResponse } from '../gemini-request.service'
import {
  AI_PROVIDER_KEY_MISSING_ERROR,
  callGemini,
  generateAIResponse,
} from '../../ai-provider.service'

vi.mock('../../ai-provider.service', () => ({
  AI_PROVIDER_KEY_MISSING_ERROR: 'AI_PROVIDER_KEY_MISSING',
  callGemini: vi.fn(),
  generateAIResponse: vi.fn(),
}))

describe('gemini-request.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the configured AI provider without depending on a Google key', async () => {
    vi.mocked(callGemini).mockResolvedValue({ response: 'respuesta del proveedor' })

    const result = await generateAiChatResponse({
      message: 'hola',
      context: 'general',
      language: 'es',
      contextPrompt: 'prompt',
      conversationHistory: [],
      userId: 'user-1',
      isSystemMessage: false,
      hasCourseContext: true,
    })

    expect(callGemini).toHaveBeenCalledOnce()
    expect(result.response).toBe('respuesta del proveedor')
  })

  it('uses fallback when provider request throws', async () => {
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

  it('does not disguise a missing provider credential as a model response', async () => {
    vi.mocked(callGemini).mockRejectedValue(new Error(AI_PROVIDER_KEY_MISSING_ERROR))

    await expect(generateAiChatResponse({
      message: 'hola',
      context: 'general',
      language: 'es',
      contextPrompt: 'prompt',
      conversationHistory: [],
      userId: null,
      isSystemMessage: false,
      hasCourseContext: false,
    })).rejects.toThrow(AI_PROVIDER_KEY_MISSING_ERROR)

    expect(generateAIResponse).not.toHaveBeenCalled()
  })
})
