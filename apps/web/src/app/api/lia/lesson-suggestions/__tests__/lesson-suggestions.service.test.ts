import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  generateLessonSuggestions,
  LessonSuggestionsGenerationError,
} from '../lesson-suggestions.service'
import type { LessonContextSnapshot } from '../lesson-suggestions.types'

const baseSnapshot: LessonContextSnapshot = {
  lessonId: '22222222-2222-2222-2222-222222222222',
  lessonTitle: 'Diseño de prompts',
  lessonDescription: 'Reglas y ejemplos',
  courseTitle: 'Curso IA',
  courseSlug: 'curso-ia',
  language: 'es',
}

const generateAiTextMock = vi.fn()

// Se aisla el servicio del proveedor: el gateway es la unica frontera con IA.
vi.mock('@/lib/ai/providers/ai-text-gateway.server', () => ({
  generateAiText: (...args: unknown[]) => generateAiTextMock(...args),
}))

function buildResponse(suggestions: string[]) {
  return { model: 'test-model', provider: 'google' as const, text: JSON.stringify({ suggestions }) }
}

describe('generateLessonSuggestions', () => {
  afterEach(() => {
    generateAiTextMock.mockReset()
  })

  it('returns three suggestion items with deterministic ids derived from hash', async () => {
    generateAiTextMock.mockResolvedValue(
      buildResponse([
        '¿Puedes resumir los puntos clave de esta lección?',
        'Dame un ejemplo aplicado a un equipo de soporte',
        '¿Qué errores comunes debo evitar al practicar?',
      ]),
    )

    const result = await generateLessonSuggestions({
      snapshot: baseSnapshot,
      contentHash: 'abc123',
    })

    expect(result).toHaveLength(3)
    expect(result.map((item) => item.id)).toEqual([
      'abc123-0',
      'abc123-1',
      'abc123-2',
    ])
    expect(result.every((item) => item.text.length >= 8)).toBe(true)
  })

  it('throws when Gemini returns malformed JSON', async () => {
    generateAiTextMock.mockResolvedValue({ model: 'test-model', provider: 'google' as const, text: 'no soy json' })

    await expect(
      generateLessonSuggestions({
        snapshot: baseSnapshot,
        contentHash: 'h',
      }),
    ).rejects.toBeInstanceOf(LessonSuggestionsGenerationError)
  })

  it('throws when fewer than three valid suggestions are returned', async () => {
    generateAiTextMock.mockResolvedValue(
      buildResponse([
        'sugerencia válida número uno',
        'corta',
        'sugerencia válida número dos',
      ]),
    )

    await expect(
      generateLessonSuggestions({
        snapshot: baseSnapshot,
        contentHash: 'h',
      }),
    ).rejects.toBeInstanceOf(LessonSuggestionsGenerationError)
  })

  it('deduplicates suggestions before validating count', async () => {
    generateAiTextMock.mockResolvedValue(
      buildResponse([
        'sugerencia repetida idéntica para test',
        'Sugerencia repetida idéntica para test',
        'una pregunta diferente y única aquí',
      ]),
    )

    await expect(
      generateLessonSuggestions({
        snapshot: baseSnapshot,
        contentHash: 'h',
      }),
    ).rejects.toBeInstanceOf(LessonSuggestionsGenerationError)
  })
})
