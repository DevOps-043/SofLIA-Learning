import { useEffect } from 'react'

import type { LearnLesson } from '../../components/learn/types'

interface UseLessonAccessTrackingParams {
  currentLesson: LearnLesson | null
  organizationId?: string | null
  slug: string
}

export function useLessonAccessTracking({
  currentLesson,
  organizationId,
  slug,
}: UseLessonAccessTrackingParams) {
  useEffect(() => {
    if (!currentLesson || !slug) {
      return
    }

    fetch(`/api/courses/${slug}/lessons/${currentLesson.lesson_id}/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(organizationId ? { organizationId } : {}),
      credentials: 'include',
    }).catch(() => null)
  }, [currentLesson?.lesson_id, organizationId, slug])
}
