'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ACTIONS, CallBackProps, EVENTS, STATUS, type Step } from 'react-joyride';
import { useTourRestart } from '../../../core/contexts/TourRestartContext';
import * as businessUserJoyrideConfig from '../config/business-user-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourProgress } from './useTourProgress';

interface UseBusinessUserJoyrideOptions {
  enabled?: boolean;
  mobilePerformanceMode?: boolean;
}

function targetExists(step: Step): boolean {
  if (typeof document === 'undefined') {
    return true;
  }

  if (typeof step.target !== 'string') {
    return true;
  }

  return document.querySelector(step.target) instanceof HTMLElement;
}

function resolveBusinessUserJoyrideSteps(isMobile: boolean): Step[] {
  if (
    typeof businessUserJoyrideConfig.buildBusinessUserJoyrideSteps === 'function'
  ) {
    return businessUserJoyrideConfig.buildBusinessUserJoyrideSteps({ isMobile });
  }

  if (Array.isArray(businessUserJoyrideConfig.businessUserJoyrideSteps)) {
    return businessUserJoyrideConfig.businessUserJoyrideSteps;
  }

  return [];
}

export function useBusinessUserJoyride(
  options: UseBusinessUserJoyrideOptions = {},
) {
  const { enabled = true, mobilePerformanceMode = false } = options;
  const { setRestart } = useTourRestart();

  const {
    shouldShowTour,
    isLoading,
    startTour,
    completeTour,
    skipTour,
  } = useTourProgress(businessUserJoyrideConfig.DASHBOARD_TOUR_ID);

  const [run, setRun] = useState(false);
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isTourFinishedInSession, setIsTourFinishedInSession] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const steps = useMemo(() => {
    return resolveBusinessUserJoyrideSteps(isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (
      !enabled ||
      mobilePerformanceMode ||
      isLoading ||
      !shouldShowTour ||
      isTourFinishedInSession ||
      run ||
      showVideoIntro
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      console.log('[useBusinessUserJoyride] Auto-starting tour video intro');
      setShowVideoIntro(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [enabled, isLoading, shouldShowTour, isTourFinishedInSession, run, showVideoIntro, mobilePerformanceMode]);

  const handleVideoComplete = useCallback(() => {
    console.log('[useBusinessUserJoyride] Video complete, preparing to start tour');
    setShowVideoIntro(false);
    setStepIndex(0);
    
    // We use a small timeout to let the DOM settle after the video modal closes
    // This ensures elements like the SofLIA button are correctly positioned for Joyride
    setTimeout(() => {
      if (steps.length === 0) {
        console.warn('[useBusinessUserJoyride] No steps found, completing tour');
        completeTour().catch((err) =>
          console.error('[useBusinessUserJoyride] No steps available:', err),
        );
        return;
      }

      console.log('[useBusinessUserJoyride] Starting Joyride with', steps.length, 'steps');
      startTour().catch((err) =>
        console.error('[useBusinessUserJoyride] DB start failed', err),
      );
      setRun(true);
    }, 300);
  }, [completeTour, startTour, steps.length]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, status, type } = data;

      if (status === STATUS.FINISHED) {
        console.log('[useBusinessUserJoyride] Tour finished');
        setRun(false);
        setIsTourFinishedInSession(true);
        completeTour().catch((err) =>
          console.error('[useBusinessUserJoyride] Complete failed', err),
        );
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
        console.log('[useBusinessUserJoyride] Tour skipped');
        setRun(false);
        setIsTourFinishedInSession(true);
        skipTour().catch((err) =>
          console.error('[useBusinessUserJoyride] Skip failed', err),
        );
        return;
      }

      if (action === ACTIONS.CLOSE) {
        console.log('[useBusinessUserJoyride] Tour closed');
        setRun(false);
        setIsTourFinishedInSession(true);
        skipTour().catch((err) =>
          console.error('[useBusinessUserJoyride] Close failed', err),
        );
        return;
      }

      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        if (action === ACTIONS.PREV) {
          setStepIndex(Math.max(0, index - 1));
          return;
        }

        // If we're on the last step and moving forward, finish the tour
        if (index >= steps.length - 1) {
          console.log('[useBusinessUserJoyride] Last step reached, finishing tour');
          setRun(false);
          setIsTourFinishedInSession(true);
          completeTour().catch((err) =>
            console.error('[useBusinessUserJoyride] Complete failed (last step)', err),
          );
          return;
        }

        setStepIndex(index + 1);
      }
    },
    [completeTour, skipTour, steps.length],
  );

  const resetTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
  }, []);

  const manualStartTour = useCallback(() => {
    console.log('[useBusinessUserJoyride] Manually restarting tour');
    setStepIndex(0);
    setRun(false);
    setIsTourFinishedInSession(false);
    if (mobilePerformanceMode) {
      setShowVideoIntro(false);
      startTour().catch((err) =>
        console.error('[useBusinessUserJoyride] Manual mobile start failed', err),
      );
      setRun(true);
      return;
    }

    setShowVideoIntro(true);
  }, [mobilePerformanceMode, startTour]);

  useEffect(() => {
    setRestart(manualStartTour, 'Reiniciar tutorial');
    return () => setRestart(null);
  }, [manualStartTour, setRestart]);

  return {
    joyrideProps: {
      steps,
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
      scrollOffset: isMobile ? 88 : 120,
      spotlightClicks: false,
      spotlightPadding: isMobile ? 12 : 8,
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
        disableAnimation: isMobile,
        hideArrow: false,
        offset: isMobile ? 10 : 15,
        styles: {
          floater: {
            filter: isMobile
              ? 'none'
              : 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
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
    shouldShowTour,
    isTourFinishedInSession,
    isLoading,
    run,
    stepIndex,
    resetTour,
    startTour: manualStartTour,
    showVideoIntro,
    handleVideoComplete,
  };
}
