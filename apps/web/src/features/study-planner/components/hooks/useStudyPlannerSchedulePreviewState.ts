'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useStudyPlannerSchedulePreviewState(savedLessonDistributionLength: number) {
  const [showSchedulePreview, setShowSchedulePreview] = useState(false)
  const [showSchedulePreviewTab, setShowSchedulePreviewTab] = useState(false)
  const previousDistributionLengthRef = useRef(savedLessonDistributionLength)

  useEffect(() => {
    const previousLength = previousDistributionLengthRef.current
    previousDistributionLengthRef.current = savedLessonDistributionLength

    if (previousLength === 0 && savedLessonDistributionLength > 0) {
      setShowSchedulePreview(true)
      setShowSchedulePreviewTab(true)
    }
  }, [savedLessonDistributionLength])

  const handleSchedulePreviewClose = useCallback(() => {
    setShowSchedulePreview(false)
  }, [])

  const handleSchedulePreviewOpen = useCallback(() => {
    setShowSchedulePreview(true)
  }, [])

  return {
    showSchedulePreview,
    setShowSchedulePreview,
    showSchedulePreviewTab,
    setShowSchedulePreviewTab,
    handleSchedulePreviewClose,
    handleSchedulePreviewOpen,
  }
}
