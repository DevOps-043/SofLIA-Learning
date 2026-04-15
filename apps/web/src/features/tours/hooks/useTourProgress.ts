'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TourProgress {
  id: string;
  user_id: string;
  tour_id: string;
  completed_at: string | null;
  skipped_at: string | null;
  step_reached: number;
  created_at: string;
  updated_at: string;
}

interface UseTourProgressReturn {
  hasSeenTour: boolean;
  isLoading: boolean;
  tourProgress: TourProgress | null;
  startTour: () => Promise<void>;
  updateStep: (step: number) => void;   // fire-and-forget, debounced
  completeTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  shouldShowTour: boolean;
}

// ---------------------------------------------------------------------------
// Delay (ms) between consecutive step-update requests. Joyride fires
// STEP_AFTER on every click; without debouncing, rapid "Next / Prev" taps
// flood the server with sequential writes that all update the same row.
// 800 ms covers most human double-clicks while keeping the DB in sync.
// ---------------------------------------------------------------------------
const STEP_DEBOUNCE_MS = 800;

export function useTourProgress(tourId: string): UseTourProgressReturn {
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tourProgress, setTourProgress] = useState<TourProgress | null>(null);

  // Debounce timer ref for updateStep — cleared on unmount
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verify whether the user has already seen this tour (called once on mount)
  useEffect(() => {
    const checkTourProgress = async () => {
      try {
        const response = await fetch(`/api/tours?tourId=${tourId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setHasSeenTour(data.hasSeenTour);
          setTourProgress(data.tourProgress);
        }
      } catch (err) {
        console.error('[useTourProgress] Error al verificar progreso del tour:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkTourProgress();
  }, [tourId]);

  // Cleanup pending debounce on unmount
  useEffect(() => {
    return () => {
      if (stepTimerRef.current !== null) {
        clearTimeout(stepTimerRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Internal helper — all tour actions share the same fetch shape
  // -------------------------------------------------------------------------
  const postTourAction = useCallback(
    async (action: string, stepReached?: number): Promise<TourProgress | null> => {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tourId, action, stepReached }),
      });

      if (!response.ok) {
        console.error(
          `[useTourProgress] POST action="${action}" failed:`,
          await response.text()
        );
        return null;
      }

      const data = await response.json();
      return data.tourProgress as TourProgress;
    },
    [tourId]
  );

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  const startTour = useCallback(async () => {
    try {
      const progress = await postTourAction('start', 0);
      if (progress) setTourProgress(progress);
    } catch (err) {
      console.error('[useTourProgress] startTour error:', err);
    }
  }, [postTourAction]);

  // Debounced: rapid step navigation collapses into a single DB write.
  // Uses fire-and-forget pattern (void return) because callers don't await it.
  const updateStep = useCallback(
    (step: number) => {
      if (stepTimerRef.current !== null) {
        clearTimeout(stepTimerRef.current);
      }

      stepTimerRef.current = setTimeout(async () => {
        try {
          const progress = await postTourAction('step', step);
          if (progress) setTourProgress(progress);
        } catch (err) {
          console.error('[useTourProgress] updateStep error:', err);
        }
      }, STEP_DEBOUNCE_MS);
    },
    [postTourAction]
  );

  const completeTour = useCallback(async () => {
    // Cancel any pending step debounce — completion supersedes it
    if (stepTimerRef.current !== null) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }

    try {
      const progress = await postTourAction('complete');
      if (progress) {
        setHasSeenTour(true);
        setTourProgress(progress);
      }
    } catch (err) {
      console.error('[useTourProgress] completeTour error:', err);
    }
  }, [postTourAction]);

  const skipTour = useCallback(async () => {
    // Cancel any pending step debounce — skip supersedes it
    if (stepTimerRef.current !== null) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }

    try {
      const progress = await postTourAction('skip');
      if (progress) {
        setHasSeenTour(true);
        setTourProgress(progress);
      }
    } catch (err) {
      console.error('[useTourProgress] skipTour error:', err);
    }
  }, [postTourAction]);

  const shouldShowTour = !isLoading && !hasSeenTour;

  return {
    hasSeenTour,
    isLoading,
    tourProgress,
    startTour,
    updateStep,
    completeTour,
    skipTour,
    shouldShowTour,
  };
}
