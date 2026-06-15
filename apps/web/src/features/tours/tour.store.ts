'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { TourConfig, TourId, TourState } from './types'

const initialSessionState = {
  activeTourConfig: null,
  currentStep: 0,
  isRunning: false,
  introVideoUrl: null,
} satisfies Pick<
  TourState,
  'activeTourConfig' | 'currentStep' | 'isRunning' | 'introVideoUrl'
>

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      ...initialSessionState,
      completedTours: [],

      startTour: (config: TourConfig) => {
        const state = get()
        // Guard re-entry during both the Joyride phase and the video phase.
        if (state.isRunning || state.introVideoUrl || config.steps.length === 0) {
          return
        }

        // When the tour has an intro video, enter the video phase first; the
        // Joyride steps start once the video completes (completeIntroVideo).
        if (config.introVideoUrl) {
          set({
            activeTourConfig: config,
            currentStep: 0,
            isRunning: false,
            introVideoUrl: config.introVideoUrl,
          })
          return
        }

        set({
          activeTourConfig: config,
          currentStep: 0,
          isRunning: true,
          introVideoUrl: null,
        })
      },

      completeIntroVideo: () => {
        const { activeTourConfig } = get()
        if (!activeTourConfig) {
          return
        }

        set({
          isRunning: true,
          introVideoUrl: null,
          currentStep: 0,
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
