// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { LearnLesson } from '../../types'
import type { VideoPlayerContextValue } from '../video-content.types'
import { useVideoProgressSync } from '../useVideoProgressSync'

const lesson: LearnLesson = {
  lesson_id: 'lesson-1',
  lesson_title: 'Lesson',
  video_provider: 'direct',
  video_provider_id: 'https://cdn.test/video.mp4',
}

function Harness() {
  const [isPlaying, setIsVideoPlaying] = useState(false)
  const currentTimeRef = useRef(0)
  const shouldAutoPlayRef = useRef(false)

  const context = {
    exitPiP: vi.fn(),
    getVideoProgress: vi.fn(() => 0),
    isPiPActive: false,
    isVideoPlaying: isPlaying,
    pauseAllVideos: vi.fn(),
    requestPiP: vi.fn(),
    saveVideoProgress: vi.fn(),
    setIsPiPActive: vi.fn(),
    setIsVideoPlaying,
    setShouldAutoPlay: vi.fn(),
    shouldAutoPlay: false,
    shouldAutoPlayRef,
  } as unknown as VideoPlayerContextValue

  useVideoProgressSync({
    currentTimeRef,
    lesson,
    videoPlayerContext: context,
  })

  return (
    <div>
      <span data-testid="playing">{String(isPlaying)}</span>
      <div className="aspect-video">
        <video />
      </div>
    </div>
  )
}

describe('useVideoProgressSync', () => {
  it('does not pause the current video when play updates the player context', () => {
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => undefined)

    const view = render(<Harness />)
    const { container } = view
    const videoElement = container.querySelector('video')
    expect(videoElement).not.toBeNull()

    if (!videoElement) return

    Object.defineProperty(videoElement, 'paused', {
      configurable: true,
      get: () => false,
    })

    act(() => {
      fireEvent(videoElement, new Event('play'))
    })

    expect(screen.getByTestId('playing')).toHaveTextContent('true')
    expect(pause).not.toHaveBeenCalled()

    Object.defineProperty(videoElement, 'paused', {
      configurable: true,
      get: () => true,
    })
    view.unmount()
    pause.mockRestore()
  })
})
