'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CallBackProps, STATUS, ACTIONS, EVENTS, Step } from 'react-joyride';
import { useTourProgress } from './useTourProgress';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourRestart } from '@/core/contexts/TourRestartContext';
import { useTranslation } from 'react-i18next';

interface UseFeatureTourOptions {
  tourId: string;
  steps: Step[];
  enabled?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

const SCROLL_CONTAINER_ID = 'main-scroll-container';
const VISIBLE_PADDING_PX = 60;
const TOP_OFFSET_PX = 100;
const STABLE_FRAMES_REQUIRED = 3;
const SCROLL_MAX_WAIT_MS = 800;

/**
 * Scroll the target element into view inside #main-scroll-container and invoke
 * `onSettled` only after the smooth scroll has actually finished (detected via
 * scrollTop stability across consecutive animation frames).
 *
 * Why callback-based instead of fixed setTimeout: smooth scroll duration in
 * Chromium scales with distance (~300–800ms). A fixed delay races the scroll
 * and Joyride captures `getBoundingClientRect()` mid-animation, drawing the
 * spotlight on the intermediate position. The element keeps moving afterwards,
 * leaving the spotlight visibly offset from its target.
 */
function scrollTargetIntoView(
  target: string | HTMLElement,
  onSettled: () => void,
): void {
  const scrollContainer = document.getElementById(SCROLL_CONTAINER_ID);
  const el =
    typeof target === 'string' ? document.querySelector(target) : target;

  if (!scrollContainer || !el) {
    onSettled();
    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const elRect = (el as HTMLElement).getBoundingClientRect();

  const alreadyInView =
    elRect.top >= containerRect.top + VISIBLE_PADDING_PX &&
    elRect.bottom <= containerRect.bottom - VISIBLE_PADDING_PX;

  if (!alreadyInView) {
    const desiredScrollTop =
      scrollContainer.scrollTop +
      (elRect.top - containerRect.top) -
      TOP_OFFSET_PX;

    scrollContainer.scrollTo({
      top: Math.max(0, desiredScrollTop),
      behavior: 'smooth',
    });
  }

  // Poll scrollTop until it stabilizes (smooth-scroll finished) or maxWait
  // fires as a safety net (e.g. user interaction cancels the scroll).
  let lastScrollTop = scrollContainer.scrollTop;
  let stableFrames = alreadyInView ? STABLE_FRAMES_REQUIRED : 0;
  const startedAt = performance.now();

  const tick = () => {
    const currentScrollTop = scrollContainer.scrollTop;
    stableFrames = currentScrollTop === lastScrollTop ? stableFrames + 1 : 0;
    lastScrollTop = currentScrollTop;

    const stable = stableFrames >= STABLE_FRAMES_REQUIRED;
    const timedOut = performance.now() - startedAt > SCROLL_MAX_WAIT_MS;

    if (stable || timedOut) {
      // Extra frame so any in-flight Framer Motion transforms commit before
      // Joyride reads getBoundingClientRect() for the spotlight.
      requestAnimationFrame(onSettled);
      return;
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

/**
 * Generic hook to manage a Joyride tour for a specific feature.
 * Connects with useTourProgress for persistence and handle common Joyride logic.
 *
 * Uses disableScrolling + manual scrollTargetIntoView to work correctly inside
 * the Business Panel's custom scroll container (#main-scroll-container).
 */
export function useFeatureTour(options: UseFeatureTourOptions) {
  const { 
    tourId, 
    steps, 
    enabled = true,
    onComplete,
    onSkip
  } = options;
  const { t } = useTranslation('business');
  const { setRestart } = useTourRestart();
  
  const { 
    shouldShowTour, 
    isLoading, 
    startTour: dbStartTour, 
    completeTour: dbCompleteTour, 
    skipTour: dbSkipTour,
    updateStep: dbUpdateStep
  } = useTourProgress(tourId);

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const pendingStepRef = useRef<number | null>(null);

  // Default disableBeacon to true for every step. Joyride's native beacon is
  // a red dot that requires an extra click before showing the tooltip; the
  // tour is `continuous`, so we want each step to render its tooltip directly.
  // Spread order preserves explicit opt-out (`disableBeacon: false`) per step.
  const enhancedSteps = useMemo(
    () => steps.map((s) => ({ disableBeacon: true, ...s })),
    [steps],
  );

  // Manual start (for "Replay" buttons)
  const manualStartTour = useCallback(() => {
    setStepIndex(0);
    if (steps.length > 0) {
      scrollTargetIntoView(steps[0].target as string, () => setRun(true));
    } else {
      setRun(true);
    }
  }, [steps]);

  // Register with global context for header replay button
  useEffect(() => {
    if (enabled) {
      setRestart(manualStartTour, t('adminTour.labels.replay') || 'Ver tutorial');
      return () => setRestart(null);
    }
  }, [enabled, manualStartTour, setRestart, t]);

  // Auto-start tour if enabled and user hasn't seen it yet
  useEffect(() => {
    if (enabled && !isLoading && shouldShowTour) {
      const timer = setTimeout(() => {
        const start = () => {
          setRun(true);
          dbStartTour().catch(err => console.error(`[useFeatureTour:${tourId}] Start failed`, err));
        };
        if (steps.length > 0) {
          scrollTargetIntoView(steps[0].target as string, start);
        } else {
          start();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enabled, isLoading, shouldShowTour, tourId, dbStartTour, steps]);

  // When pendingStepRef changes, scroll first, then update stepIndex once the
  // smooth scroll has actually settled — prevents the spotlight from being
  // drawn on a mid-scroll position of the target.
  useEffect(() => {
    if (pendingStepRef.current !== null) {
      const nextIdx = pendingStepRef.current;
      pendingStepRef.current = null;

      if (nextIdx >= 0 && nextIdx < steps.length) {
        scrollTargetIntoView(steps[nextIdx].target as string, () =>
          setStepIndex(nextIdx),
        );
      }
    }
  });

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Handle step navigation: scroll first, then advance
    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
      dbUpdateStep(nextIndex);

      // Use pendingStepRef to trigger scroll-then-advance
      pendingStepRef.current = nextIndex;
      // Force a re-render so the effect above runs
      setRun(prev => prev);
    }

    // Handle tour completion
    if (status === STATUS.FINISHED) {
      setRun(false);
      dbCompleteTour().catch(err => console.error(`[useFeatureTour:${tourId}] Complete failed`, err));
      if (onComplete) onComplete();
      return;
    }

    // Handle tour skip or close
    if (status === STATUS.SKIPPED || action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
      setRun(false);
      dbSkipTour().catch(err => console.error(`[useFeatureTour:${tourId}] Skip failed`, err));
      if (onSkip) onSkip();
      return;
    }
  }, [tourId, dbCompleteTour, dbSkipTour, dbUpdateStep, onComplete, onSkip, steps]);

  return {
    joyrideProps: {
      steps: enhancedSteps,
      run,
      stepIndex,
      callback: handleJoyrideCallback,
      continuous: true,
      showProgress: false,
      showSkipButton: true,
      hideCloseButton: false,
      disableOverlayClose: true,
      disableCloseOnEsc: true,
      // We handle scrolling manually inside the custom scroll container
      disableScrolling: true,
      disableScrollParentFix: true,
      scrollToFirstStep: false,
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
        offset: 15,
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
    run,
    stepIndex,
    startTour: manualStartTour,
    isLoading,
    hasSeenTour: !shouldShowTour && !isLoading
  };
}
