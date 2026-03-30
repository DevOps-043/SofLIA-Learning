'use client';

import { useState, useEffect, useCallback } from 'react';

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
  updateStep: (step: number) => Promise<void>;
  completeTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  shouldShowTour: boolean;
}

export function useTourProgress(tourId: string): UseTourProgressReturn {
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tourProgress, setTourProgress] = useState<TourProgress | null>(null);

  // Verificar si el usuario ya vio el tour
  useEffect(() => {
    const checkTourProgress = async () => {
      try {
        const response = await fetch(`/api/tours?tourId=${tourId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasSeenTour(data.hasSeenTour);
          setTourProgress(data.tourProgress);
        }
      } catch (error) {
        console.error('Error al verificar progreso del tour:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTourProgress();
  }, [tourId]);

  // Registrar inicio del tour
  const startTour = useCallback(async () => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tourId, action: 'start', stepReached: 0 })
      });

      if (response.ok) {
        const data = await response.json();
        setTourProgress(data.tourProgress);
      } else {
        console.error('❌ [useTourProgress] Failed to start tour:', await response.text());
      }
    } catch (error) {
      console.error('Error al iniciar tour:', error);
    }
  }, [tourId]);

  // Actualizar paso actual
  const updateStep = useCallback(async (step: number) => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tourId, action: 'step', stepReached: step })
      });

      if (response.ok) {
        const data = await response.json();
        setTourProgress(data.tourProgress);
      }
    } catch (error) {
      console.error('Error al actualizar paso del tour:', error);
    }
  }, [tourId]);

  // Marcar tour como completado
  const completeTour = useCallback(async () => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tourId, action: 'complete' })
      });

      if (response.ok) {
        const data = await response.json();
        setHasSeenTour(true);
        setTourProgress(data.tourProgress);
      }
    } catch (error) {
      console.error('Error al completar tour:', error);
    }
  }, [tourId]);

  // Saltar tour
  const skipTour = useCallback(async () => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tourId, action: 'skip' })
      });

      if (response.ok) {
        const data = await response.json();
        setHasSeenTour(true);
        setTourProgress(data.tourProgress);
      }
    } catch (error) {
      console.error('Error al saltar tour:', error);
    }
  }, [tourId]);

  // Determinar si se debe mostrar el tour
  const shouldShowTour = !isLoading && !hasSeenTour;

  return {
    hasSeenTour,
    isLoading,
    tourProgress,
    startTour,
    updateStep,
    completeTour,
    skipTour,
    shouldShowTour
  };
}
