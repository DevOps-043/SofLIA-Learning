// @vitest-environment jsdom

import type React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NATIVE_VIDEO_BUFFERING_DELAY_MS } from '@/lib/media'

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

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not start playback automatically on mount', () => {
    render(<CustomVideoPlayer src="https://example.com/video.mp4" />)

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
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

  it('pauses playback when the document becomes hidden', () => {
    const { container } = render(
      <CustomVideoPlayer src="https://example.com/video.mp4" />
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
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    })

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('does not micro-seek when the browser reports a stalled video', () => {
    const { container } = render(
      <CustomVideoPlayer src="https://example.com/video.mp4" />
    )
    const videoElement = container.querySelector('video')

    expect(videoElement).not.toBeNull()

    if (!videoElement) {
      return
    }

    Object.defineProperty(videoElement, 'currentTime', {
      configurable: true,
      writable: true,
      value: 42,
    })

    act(() => {
      fireEvent(videoElement, new Event('stalled'))
    })

    expect(videoElement.currentTime).toBe(42)
  })

  it('ignores transient waiting events when playback already has future data', () => {
    vi.useFakeTimers()
    const { container } = render(
      <CustomVideoPlayer src="https://example.com/video.mp4" />
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

  it('clears the buffering spinner as soon as time advances again', () => {
    vi.useFakeTimers()
    const { container } = render(
      <CustomVideoPlayer src="https://example.com/video.mp4" />
    )
    const videoElement = container.querySelector('video')

    expect(videoElement).not.toBeNull()

    if (!videoElement) {
      return
    }

    let readyState = 2

    Object.defineProperty(videoElement, 'duration', {
      configurable: true,
      value: 100,
    })
    Object.defineProperty(videoElement, 'currentTime', {
      configurable: true,
      writable: true,
      value: 10,
    })
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
      get: () => readyState,
    })

    act(() => {
      fireEvent(videoElement, new Event('loadedmetadata'))
      fireEvent(videoElement, new Event('play'))
      fireEvent(videoElement, new Event('waiting'))
      vi.advanceTimersByTime(NATIVE_VIDEO_BUFFERING_DELAY_MS + 1)
    })

    expect(
      container.querySelector('[data-video-buffering-indicator="true"]')
    ).not.toBeNull()

    readyState = 3
    videoElement.currentTime = 11

    act(() => {
      fireEvent(videoElement, new Event('timeupdate'))
    })

    expect(
      container.querySelector('[data-video-buffering-indicator="true"]')
    ).toBeNull()
  })

  it('locks forward seeking controls while the first watch is incomplete', async () => {
    const { container } = render(
      <CustomVideoPlayer
        seekControlsLocked
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
      value: 100,
    })
    Object.defineProperty(videoElement, 'currentTime', {
      configurable: true,
      writable: true,
      value: 12,
    })

    act(() => {
      fireEvent(videoElement, new Event('loadedmetadata'))
    })

    await waitFor(() => {
      expect(
        container.querySelector('[data-video-progress-bar="true"]')
      ).toHaveAttribute('data-seek-locked', 'true')
    })

    const progressBar = container.querySelector(
      '[data-video-progress-bar="true"]'
    )
    expect(progressBar).not.toBeNull()

    if (!progressBar) {
      return
    }

    Object.defineProperty(progressBar, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        bottom: 0,
        height: 0,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => undefined,
      }),
    })

    fireEvent.click(progressBar, { clientX: 80 })
    expect(videoElement.currentTime).toBe(12)

    const forwardButton = container.querySelector(
      '[title="Avanzar 10s"]'
    ) as HTMLButtonElement | null
    expect(forwardButton).not.toBeNull()

    if (!forwardButton) {
      return
    }

    expect(forwardButton).toBeDisabled()

    fireEvent.click(forwardButton)
    expect(videoElement.currentTime).toBe(12)
  })
})
