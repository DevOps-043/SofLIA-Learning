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

const sendMessageMock = vi.fn()

vi.mock('@google/generative-ai', () => {
  class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: sendMessageMock,
      }
    }
  }
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    HarmBlockThreshold: { BLOCK_NONE: 'BLOCK_NONE' },
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
    SchemaType: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING' },
  }
})

function buildResponse(suggestions: string[]) {
  return {
    response: {
      text: () => JSON.stringify({ suggestions }),
    },
  }
}

describe('generateLessonSuggestions', () => {
  afterEach(() => {
    sendMessageMock.mockReset()
  })

  it('returns three suggestion items with deterministic ids derived from hash', async () => {
    sendMessageMock.mockResolvedValue(
      buildResponse([
        '¿Puedes resumir los puntos clave de esta lección?',
        'Dame un ejemplo aplicado a un equipo de soporte',
        '¿Qué errores comunes debo evitar al practicar?',
      ]),
    )

    const result = await generateLessonSuggestions({
      snapshot: baseSnapshot,
      contentHash: 'abc123',
      apiKey: 'fake-key',
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
    sendMessageMock.mockResolvedValue({
      response: { text: () => 'no soy json' },
    })

    await expect(
      generateLessonSuggestions({
        snapshot: baseSnapshot,
        contentHash: 'h',
        apiKey: 'fake-key',
      }),
    ).rejects.toBeInstanceOf(LessonSuggestionsGenerationError)
  })

  it('throws when fewer than three valid suggestions are returned', async () => {
    sendMessageMock.mockResolvedValue(
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
        apiKey: 'fake-key',
      }),
    ).rejects.toBeInstanceOf(LessonSuggestionsGenerationError)
  })

  it('deduplicates suggestions before validating count', async () => {
    sendMessageMock.mockResolvedValue(
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
        apiKey: 'fake-key',
      }),
    ).rejects.toBeInstanceOf(LessonSuggestionsGenerationError)
  })
})
