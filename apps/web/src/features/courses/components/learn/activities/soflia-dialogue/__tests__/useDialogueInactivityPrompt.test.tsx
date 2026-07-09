// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDialogueInactivityPrompt } from '../useDialogueInactivityPrompt'

const PROMPT_SECONDS = 180

describe('useDialogueInactivityPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows the prompt after the inactivity threshold', () => {
    const { result } = renderHook(() =>
      useDialogueInactivityPrompt({
        enabled: true,
        activitySignals: ['', 1],
      }),
    )

    expect(result.current.showInactivityPrompt).toBe(false)

    act(() => {
      vi.advanceTimersByTime(PROMPT_SECONDS * 1000)
    })

    expect(result.current.showInactivityPrompt).toBe(true)
  })

  it('resets the timer when an activity signal changes (typing / new turns)', () => {
    const { rerender, result } = renderHook(
      ({ draft }: { draft: string }) =>
        useDialogueInactivityPrompt({
          enabled: true,
          activitySignals: [draft, 1],
        }),
      { initialProps: { draft: '' } },
    )

    act(() => {
      vi.advanceTimersByTime((PROMPT_SECONDS - 10) * 1000)
    })
    rerender({ draft: 'escribiendo...' })
    act(() => {
      vi.advanceTimersByTime((PROMPT_SECONDS - 10) * 1000)
    })

    // 2 * (threshold - 10s) elapsed, but never threshold without activity.
    expect(result.current.showInactivityPrompt).toBe(false)

    act(() => {
      vi.advanceTimersByTime(10 * 1000)
    })
    expect(result.current.showInactivityPrompt).toBe(true)
  })

  it('does not run while disabled and hides a stale prompt when leaving the active state', () => {
    const { rerender, result } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useDialogueInactivityPrompt({
          enabled,
          activitySignals: ['', 1],
        }),
      { initialProps: { enabled: true } },
    )

    act(() => {
      vi.advanceTimersByTime(PROMPT_SECONDS * 1000)
    })
    expect(result.current.showInactivityPrompt).toBe(true)

    // Session becomes terminal → prompt hides and timer stays off.
    rerender({ enabled: false })
    expect(result.current.showInactivityPrompt).toBe(false)

    act(() => {
      vi.advanceTimersByTime(PROMPT_SECONDS * 2 * 1000)
    })
    expect(result.current.showInactivityPrompt).toBe(false)
  })

  it('re-arms the timer after dismissing the prompt', () => {
    const { result } = renderHook(() =>
      useDialogueInactivityPrompt({
        enabled: true,
        activitySignals: ['', 1],
      }),
    )

    act(() => {
      vi.advanceTimersByTime(PROMPT_SECONDS * 1000)
    })
    expect(result.current.showInactivityPrompt).toBe(true)

    act(() => {
      result.current.dismissInactivityPrompt()
    })
    expect(result.current.showInactivityPrompt).toBe(false)

    act(() => {
      vi.advanceTimersByTime(PROMPT_SECONDS * 1000)
    })
    expect(result.current.showInactivityPrompt).toBe(true)
  })

  it('supports a custom threshold', () => {
    const { result } = renderHook(() =>
      useDialogueInactivityPrompt({
        enabled: true,
        activitySignals: [],
        promptAfterSeconds: 5,
      }),
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.showInactivityPrompt).toBe(true)
  })
})
