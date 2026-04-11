'use client'

import { CourseLearnPageShell } from './CourseLearnPageShell'
import { VideoPlayerProvider } from './VideoPlayerContext'
import { useLearnPageLogic } from '../../../../features/courses/hooks/useLearnPageLogic'

function CourseLearnPageContent() {
  const logic = useLearnPageLogic()

  return <CourseLearnPageShell logic={logic} />
}

export default function CourseLearnPage() {
  return (
    <VideoPlayerProvider>
      <CourseLearnPageContent />
    </VideoPlayerProvider>
  )
}
