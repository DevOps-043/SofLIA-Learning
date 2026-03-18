'use client';

import { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTourProgress } from './useTourProgress';
import { businessPanelJoyrideSteps, BUSINESS_PANEL_TOUR_ID } from '../config/business-panel-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourRestart } from '@/core/contexts/TourRestartContext';

interface UseBusinessPanelJoyrideOptions {
  enabled?: boolean;
}

export function useBusinessPanelJoyride(options: UseBusinessPanelJoyrideOptions = {}) {
  const { enabled = true } = options;
  
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour } = useTourProgress(BUSINESS_PANEL_TOUR_ID);
  const [run, setRun] = useState(false);
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { setRestart } = useTourRestart();

  // Auto-start tour when conditions are met
  useEffect(() => {
    if (!enabled || isLoading || !shouldShowTour) {
      return;
    }

    // Wait for the page to render before starting video intro
    const timer = setTimeout(() => {
      setShowVideoIntro(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [enabled, isLoading, shouldShowTour]);

  const handleVideoComplete = useCallback(() => {
    setShowVideoIntro(false);
    startTour().catch(err => console.error('[useBusinessPanelJoyride] DB start failed', err));
    setRun(true);
  }, [startTour]);

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Handle tour completion
    if (status === STATUS.FINISHED) {
      setRun(false);
      completeTour().catch(err => console.error('[useBusinessPanelJoyride] Complete failed', err));
      return;
    }

    // Handle tour skip
    if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
      setRun(false);
      skipTour().catch(err => console.error('[useBusinessPanelJoyride] Skip failed', err));
      return;
    }

    // Handle close button
    if (action === ACTIONS.CLOSE) {
      setRun(false);
      skipTour().catch(err => console.error('[useBusinessPanelJoyride] Close failed', err));
      return;
    }

    // Handle step navigation
    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }
  }, [completeTour, skipTour]);

  // Reset tour (for testing)
  const resetTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
  }, []);

  // Manual start tour
  const manualStartTour = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  useEffect(() => {
    setRestart(manualStartTour, 'Reiniciar tutorial');
    return () => setRestart(null);
  }, [manualStartTour, setRestart]);

  return {
    // Joyride props to spread
    joyrideProps: {
      steps: businessPanelJoyrideSteps,
      run,
      stepIndex,
      callback: handleJoyrideCallback,
      continuous: true,
      showProgress: false,
      showSkipButton: true,
      hideCloseButton: false,
      disableOverlayClose: true,
      disableCloseOnEsc: true,
      disableScrolling: false,
      scrollToFirstStep: true,
      scrollOffset: 120, // Reasonable offset to clear header but keep element visible
      spotlightClicks: false,
      spotlightPadding: 8,
      tooltipComponent: JoyrideTooltip,
      styles: {
        options: {
          zIndex: 10000,
          arrowColor: '#1E2329',
        },
        spotlight: {
          borderRadius: 16,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
