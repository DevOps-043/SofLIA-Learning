'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ACTIONS, CallBackProps, EVENTS, STATUS, type Step } from 'react-joyride';
import { useTourRestart } from '../../../core/contexts/TourRestartContext';
import * as businessUserJoyrideConfig from '../config/business-user-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourProgress } from './useTourProgress';

interface UseBusinessUserJoyrideOptions {
  enabled?: boolean;
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
  const { enabled = true } = options;
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
    const candidateSteps = resolveBusinessUserJoyrideSteps(isMobile);

    if (!hasMounted) {
      return candidateSteps;
    }

    return candidateSteps.filter(targetExists);
  }, [hasMounted, isMobile]);

  useEffect(() => {
    if (!enabled || isLoading || !shouldShowTour) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowVideoIntro(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [enabled, isLoading, shouldShowTour]);

  const handleVideoComplete = useCallback(() => {
    setShowVideoIntro(false);
    setStepIndex(0);
    setRun(false);

    if (steps.length === 0) {
      completeTour().catch((err) =>
        console.error('[useBusinessUserJoyride] No steps available:', err),
      );
      return;
    }

    startTour().catch((err) =>
      console.error('[useBusinessUserJoyride] DB start failed', err),
    );
    setRun(true);
  }, [completeTour, startTour, steps.length]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, status, type } = data;

      if (status === STATUS.FINISHED) {
        setRun(false);
        completeTour().catch((err) =>
          console.error('[useBusinessUserJoyride] Complete failed', err),
        );
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
        setRun(false);
        skipTour().catch((err) =>
          console.error('[useBusinessUserJoyride] Skip failed', err),
        );
        return;
      }

      if (action === ACTIONS.CLOSE) {
        setRun(false);
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

        setStepIndex((currentStepIndex) =>
          Math.min(currentStepIndex + 1, Math.max(steps.length - 1, 0)),
        );
      }
    },
    [completeTour, skipTour, steps.length],
  );

  const resetTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
  }, []);

  const manualStartTour = useCallback(() => {
    setStepIndex(0);
    setRun(false);
    setShowVideoIntro(true);
  }, []);

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
    isLoading,
    run,
    stepIndex,
    resetTour,
    startTour: manualStartTour,
    showVideoIntro,
    handleVideoComplete,
  };
}
