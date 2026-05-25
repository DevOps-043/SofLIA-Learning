'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { TourConfig, TourId, TourState } from './types'

const initialSessionState = {
  activeTourConfig: null,
  currentStep: 0,
  isRunning: false,
} satisfies Pick<TourState, 'activeTourConfig' | 'currentStep' | 'isRunning'>

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      ...initialSessionState,
      completedTours: [],

      startTour: (config: TourConfig) => {
        if (get().isRunning || config.steps.length === 0) {
          return
        }

        set({
          activeTourConfig: config,
          currentStep: 0,
          isRunning: true,
        })
      },

      stopTour: () => {
        set(initialSessionState)
      },

      nextStep: () => {
        set((state) => {
          const totalSteps = state.activeTourConfig?.steps.length ?? 0
          const lastStep = Math.max(totalSteps - 1, 0)

          return {
            currentStep: Math.min(state.currentStep + 1, lastStep),
          }
        })
      },

      prevStep: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        }))
      },

      goToStep: (step: number) => {
        set({ currentStep: step })
      },

      markCompleted: (id: TourId) => {
        const { completedTours } = get()

        if (completedTours.includes(id)) {
          return
        }

        set({
          completedTours: [...completedTours, id],
        })
      },

      hasCompleted: (id: TourId) => get().completedTours.includes(id),

      resetTour: (id: TourId) => {
        set((state) => ({
          completedTours: state.completedTours.filter((tourId) => tourId !== id),
        }))
      },
    }),
    {
      name: 'soflia:tours',
      partialize: (state) => ({
        completedTours: state.completedTours,
      }),
    },
  ),
)
