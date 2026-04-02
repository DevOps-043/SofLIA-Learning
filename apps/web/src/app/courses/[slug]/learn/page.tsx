'use client'

import { CourseLearnPageShell } from './CourseLearnPageShell'
import { useLearnPageLogic } from '../../../../features/courses/hooks/useLearnPageLogic'

export default function CourseLearnPage() {
  const logic = useLearnPageLogic()

  return <CourseLearnPageShell logic={logic} />
}
