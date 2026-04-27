// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLessonChatSuggestions } from '../useLessonChatSuggestions'

vi.mock('@/core/providers/I18nProvider', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: () => {} }),
}))

function buildSuggestionsResponse(
  suggestions: Array<{ id: string; text: string }>,
  status = 200,
) {
  return new Response(
    JSON.stringify({
      suggestions,
      source: 'generated',
      generatedAt: new Date().toISOString(),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const baseParams = {
  lessonId: '11111111-1111-1111-1111-111111111111',
  courseSlug: 'curso-demo',
  enabled: true,
}

const sampleSuggestions = [
  { id: 'h-0', text: 'Pregunta uno con suficiente longitud' },
  { id: 'h-1', text: 'Pregunta dos con suficiente longitud' },
  { id: 'h-2', text: 'Pregunta tres con suficiente longitud' },
]

describe('useLessonChatSuggestions', () => {
  it('fetches and exposes three suggestions when enabled', async () => {
    fetchMock.mockResolvedValue(buildSuggestionsResponse(sampleSuggestions))

    const { result } = renderHook(() => useLessonChatSuggestions(baseParams))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.suggestions).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('removes only the used suggestion when markUsed is called', async () => {
    fetchMock.mockResolvedValue(buildSuggestionsResponse(sampleSuggestions))

    const { result } = renderHook(() => useLessonChatSuggestions(baseParams))

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(3)
    })

    act(() => {
      result.current.markUsed('h-1')
    })

    expect(result.current.suggestions.map((item) => item.id)).toEqual([
      'h-0',
      'h-2',
    ])
  })

  it('reset() restores all suggestions including previously used ones', async () => {
    fetchMock.mockResolvedValue(buildSuggestionsResponse(sampleSuggestions))

    const { result } = renderHook(() => useLessonChatSuggestions(baseParams))

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(3)
    })

    act(() => {
      result.current.markUsed('h-0')
      result.current.markUsed('h-2')
    })

    expect(result.current.suggestions).toHaveLength(1)

    act(() => {
      result.current.reset()
    })

    expect(result.current.suggestions).toHaveLength(3)
  })

  it('returns empty list and no error when API responds 503 (degradation)', async () => {
    fetchMock.mockResolvedValue(buildSuggestionsResponse([], 503))

    const { result } = renderHook(() => useLessonChatSuggestions(baseParams))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.suggestions).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch when disabled', async () => {
    fetchMock.mockResolvedValue(buildSuggestionsResponse(sampleSuggestions))

    renderHook(() =>
      useLessonChatSuggestions({ ...baseParams, enabled: false }),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
