'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect, useCallback, useMemo } from 'react';
import { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTourProgress } from './useTourProgress';
import { getBusinessPanelJoyrideSteps, BUSINESS_PANEL_TOUR_ID } from '../config/business-panel-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourRestart } from '@/core/contexts/TourRestartContext';
import { useTranslation } from 'react-i18next';
import type { SofliaJoyrideEvent as CallBackProps } from '../types/joyride';

interface UseBusinessPanelJoyrideOptions {
  enabled?: boolean;
}

export function useBusinessPanelJoyride(options: UseBusinessPanelJoyrideOptions = {}) {
  const { enabled = true } = options;
  const { t } = useTranslation('business');
  
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour } = useTourProgress(BUSINESS_PANEL_TOUR_ID);
  const [run, setRun] = useState(false);
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFinishedInSession, setIsFinishedInSession] = useState(false);
  const { setRestart } = useTourRestart();
  const steps = useMemo(() => getBusinessPanelJoyrideSteps(t), [t]);

  const stopTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    setShowVideoIntro(false);
    setIsFinishedInSession(true);
  }, []);

  const finishTour = useCallback(() => {
    stopTour();
    completeTour().catch(err => techDebtLogger.error('[useBusinessPanelJoyride] Complete failed', err));
  }, [completeTour, stopTour]);

  const dismissTour = useCallback((reason: 'skip' | 'close') => {
    stopTour();
    const label = reason === 'close' ? 'Close' : 'Skip';
    skipTour().catch(err => techDebtLogger.error(`[useBusinessPanelJoyride] ${label} failed`, err));
  }, [skipTour, stopTour]);

  // Auto-start tour when conditions are met
  useEffect(() => {
    if (!enabled || isLoading || !shouldShowTour || isFinishedInSession) {
      return;
    }

    // Wait for the page to render before starting video intro
    const timer = setTimeout(() => {
      setShowVideoIntro(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [enabled, isFinishedInSession, isLoading, shouldShowTour]);

  useEffect(() => {
    if (!enabled) {
      setRun(false);
      setStepIndex(0);
      setShowVideoIntro(false);
    }
  }, [enabled]);

  const handleVideoComplete = useCallback(() => {
    setShowVideoIntro(false);
    setStepIndex(0);
    setIsFinishedInSession(false);
    startTour().catch(err => techDebtLogger.error('[useBusinessPanelJoyride] DB start failed', err));
    setRun(true);
  }, [startTour]);

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Handle tour completion
    if (status === STATUS.FINISHED) {
      finishTour();
      return;
    }

    // Handle tour skip
    if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
      dismissTour('skip');
      return;
    }

    // Handle close button
    if (action === ACTIONS.CLOSE) {
      dismissTour('close');
      return;
    }

    // Handle step navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = action === ACTIONS.PREV ? Math.max(0, index - 1) : index + 1;

      if (nextIndex >= steps.length) {
        finishTour();
        return;
      }

      setStepIndex(nextIndex);
    }
  }, [dismissTour, finishTour, steps.length]);

  // Reset tour (for testing)
  const resetTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    setShowVideoIntro(false);
    setIsFinishedInSession(false);
  }, []);

  // Manual start tour
  const manualStartTour = useCallback(() => {
    setStepIndex(0);
    setRun(false); // Reset joyride run state
    setIsFinishedInSession(false);
    setShowVideoIntro(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setRestart(manualStartTour, 'Reiniciar tutorial');
    return () => setRestart(null);
  }, [enabled, manualStartTour, setRestart]);

  return {
    // Joyride props to spread
    joyrideProps: {
      steps,
      run,
      stepIndex,
      callback: handleJoyrideCallback,
      continuous: true,
      showProgress: false,
      showSkipButton: true,
      hideCloseButton: false,
      disableOverlay: true,
      disableOverlayClose: false,
      disableCloseOnEsc: false,
      disableFocus: true,
      disableScrolling: false,
      scrollToFirstStep: true,
      scrollOffset: 120, // Reasonable offset to clear header but keep element visible
      spotlightClicks: true,
      spotlightPadding: 8,
      tooltipComponent: JoyrideTooltip,
      styles: {
        options: {
          zIndex: 10000,
          arrowColor: 'var(--color-gray-800)',
        },
        spotlight: {
          borderRadius: 16,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          pointerEvents: 'none',
        },
      },
      floaterProps: {
        disableAnimation: false,
        hideArrow: false,
        offset: 15, // Distance from target element
        styles: {
          floater: {
            filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
          },
        },
      },
      locale: {
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
      },
    },
    // State and controls
    shouldShowTour,
    isLoading,
    run,
    stepIndex,
    resetTour,
    startTour: manualStartTour,
    showVideoIntro,
    handleVideoComplete,
  };
}
