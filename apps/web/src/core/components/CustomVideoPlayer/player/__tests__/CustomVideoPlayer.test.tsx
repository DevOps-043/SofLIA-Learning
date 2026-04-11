// @vitest-environment jsdom

import type React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CustomVideoPlayer } from '../../CustomVideoPlayer'

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
    button: ({ children, ...props }: React.ComponentProps<'button'>) => (
      <button {...stripMotionProps(props)}>{children}</button>
    ),
    div: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div {...stripMotionProps(props)}>{children}</div>
    ),
  },
}))

describe('CustomVideoPlayer completion fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })

    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('notifies completion when playback reaches the end during timeupdate', async () => {
    const onComplete = vi.fn()
    const { container } = render(
      <CustomVideoPlayer
        onComplete={onComplete}
        src="https://example.com/video.mp4"
      />
    )

    const videoElement = container.querySelector('video')

    expect(videoElement).not.toBeNull()

    if (!videoElement) {
      return
    }

    Object.defineProperty(videoElement, 'duration', {
      configurable: true,
      value: 126,
    })
    Object.defineProperty(videoElement, 'currentTime', {
      configurable: true,
      writable: true,
      value: 125.9,
    })
    Object.defineProperty(videoElement, 'paused', {
      configurable: true,
      get: () => false,
    })
    Object.defineProperty(videoElement, 'ended', {
      configurable: true,
      get: () => false,
    })

    act(() => {
      fireEvent(videoElement, new Event('loadedmetadata'))
    })

    await waitFor(() => {
      expect(container.textContent).toContain('2:06')
    })

    act(() => {
      fireEvent(videoElement, new Event('timeupdate'))
      fireEvent(videoElement, new Event('timeupdate'))
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
