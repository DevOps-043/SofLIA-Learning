// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useBrowserSpeechRecognition } from '../useBrowserSpeechRecognition'
import type { BrowserSpeechRecognition } from '../browser-speech-recognition/browser-speech-recognition.types'

type SpeechRecognitionResultEvent = Parameters<NonNullable<BrowserSpeechRecognition['onresult']>>[0]

class MockSpeechRecognition implements BrowserSpeechRecognition {
  continuous = false
  interimResults = false
  lang = ''
  onend: (() => void) | null = null
  onerror: BrowserSpeechRecognition['onerror'] = null
  onresult: BrowserSpeechRecognition['onresult'] = null
  start = vi.fn()
  stop = vi.fn()
}

let recognition: MockSpeechRecognition | null = null

function installSpeechRecognitionMock() {
  recognition = null

  Object.defineProperty(window, 'SpeechRecognition', {
    configurable: true,
    value: class extends MockSpeechRecognition {
      constructor() {
        super()
        recognition = this
      }
    },
  })
}

function buildResultEvent(...transcripts: string[]): SpeechRecognitionResultEvent {
  return {
    results: {
      length: transcripts.length,
      ...Object.fromEntries(
        transcripts.map((transcript, index) => [
          index,
          {
            0: { transcript },
            length: 1,
          },
        ]),
      ),
    },
  } as SpeechRecognitionResultEvent
}

describe('useBrowserSpeechRecognition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installSpeechRecognitionMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: undefined,
    })
  })

  it('applies the full transcript and resets listening state', async () => {
    const onTranscript = vi.fn()
    const { result } = renderHook(() =>
      useBrowserSpeechRecognition({
        lang: 'es-ES',
        onTranscript,
      }),
    )

    await act(async () => {
      await result.current.toggleListening()
    })

    expect(result.current.isListening).toBe(true)

    act(() => {
      recognition?.onresult?.(buildResultEvent(' Hola ', ' mundo '))
      vi.advanceTimersByTime(250)
    })

    expect(onTranscript).toHaveBeenCalledWith('Hola mundo')
    expect(result.current.isListening).toBe(false)
  })

  it('does not leave dictation stuck when recognition ends without text', async () => {
    const { result } = renderHook(() =>
      useBrowserSpeechRecognition({
        lang: 'es-ES',
        onTranscript: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.toggleListening()
    })

    expect(result.current.isListening).toBe(true)

    act(() => {
      recognition?.onend?.()
    })

    expect(result.current.isListening).toBe(false)
  })
})
