// @vitest-environment jsdom

import type React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NATIVE_VIDEO_BUFFERING_DELAY_MS } from '@/lib/media'

import { OnboardingVideoPlayer } from '../OnboardingVideoPlayer'

function stripMotionProps<T extends Record<string, unknown>>(props: T) {
  const {
    animate,
    exit,
    initial,
    transition,
    ...domProps
  } = props

  void animate
  void exit
  void initial
  void transition

  return domProps
}

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div {...stripMotionProps(props)}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('OnboardingVideoPlayer buffering', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })

    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: vi.fn(),
    })

    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not show a buffering spinner for transient waiting events while video has playable data', () => {
    const { container } = render(
      <OnboardingVideoPlayer
        videos={['https://example.com/intro.mp4']}
        onComplete={vi.fn()}
      />
    )
    const videoElement = container.querySelector('video')

    expect(videoElement).not.toBeNull()

    if (!videoElement) {
      return
    }

    Object.defineProperty(videoElement, 'paused', {
      configurable: true,
      get: () => false,
    })
    Object.defineProperty(videoElement, 'ended', {
      configurable: true,
      get: () => false,
    })
    Object.defineProperty(videoElement, 'readyState', {
      configurable: true,
      get: () => 3,
    })

    act(() => {
      fireEvent(videoElement, new Event('play'))
      fireEvent(videoElement, new Event('waiting'))
      vi.advanceTimersByTime(NATIVE_VIDEO_BUFFERING_DELAY_MS + 1)
    })

    expect(
      container.querySelector('[data-video-buffering-indicator="true"]')
    ).toBeNull()
  })
})
