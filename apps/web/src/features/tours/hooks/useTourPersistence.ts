'use client'

import { useCallback } from 'react'

import { useTourStore } from '../tour.store'
import type { TourId } from '../types'

export function useTourPersistence() {
  const completedTours = useTourStore((state) => state.completedTours)
  const markCompletedAction = useTourStore((state) => state.markCompleted)
  const resetTourAction = useTourStore((state) => state.resetTour)

  const hasCompleted = useCallback(
    (id: TourId) => completedTours.includes(id),
    [completedTours],
  )

  return {
    hasCompleted,
    markCompleted: markCompletedAction,
    resetTour: resetTourAction,
  }
}
