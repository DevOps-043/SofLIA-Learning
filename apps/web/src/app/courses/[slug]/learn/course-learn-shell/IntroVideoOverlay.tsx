'use client'

import { OnboardingVideoPlayer } from '@/features/courses/components/onboarding-video-player/OnboardingVideoPlayer'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function IntroVideoOverlay({ shell }: { shell: CourseLearnShellState }) {
  if (!shell.showVideoIntro || shell.introVideos.length === 0) return null
  return <OnboardingVideoPlayer videos={shell.introVideos} onComplete={shell.handleVideoIntroComplete} />
}
