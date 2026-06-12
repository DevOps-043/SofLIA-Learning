'use client'

import { CourseLearnPageShell } from '@/app/courses/[slug]/learn/CourseLearnPageShell'
import { VideoPlayerProvider } from '@/app/courses/[slug]/learn/VideoPlayerContext'
import { useLearnPageLogic } from '@/features/courses/hooks/useLearnPageLogic'

function OrganizationCourseLearnPageContent() {
  const logic = useLearnPageLogic()

  return <CourseLearnPageShell logic={logic} />
}

export default function OrganizationCourseLearnPage() {
  return (
    <VideoPlayerProvider>
      <OrganizationCourseLearnPageContent />
    </VideoPlayerProvider>
  )
}
