'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ACTIONS, EVENTS, STATUS, type EventData, type Step } from 'react-joyride';
import {
  getBusinessUserDashboardTourTargetSelector,
} from '../../../core/constants/tourTargets';
import { useTourRestart } from '../../../core/contexts/TourRestartContext';
import * as businessUserJoyrideConfig from '../config/business-user-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourProgress } from './useTourProgress';
import {
  waitForJoyrideStepTargetReady,
  waitForJoyrideTargetReady,
} from '../utils/joyride-targets';

interface UseBusinessUserJoyrideOptions {
  enabled?: boolean;
  hasCourseControls?: boolean;
  hasLearningPaths?: boolean;
  mobilePerformanceMode?: boolean;
}

const BUSINESS_USER_STEP_TARGET_TIMEOUT_MS = 4500;

function wait(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function queryTourTarget(selector: string): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const element = document.querySelector(selector);
  return element instanceof HTMLElement ? element : null;
}

function clickTourTarget(selector: string): boolean {
  const element = queryTourTarget(selector);

  if (!element) {
    return false;
  }

  // Programmatic click
  element.click();
  
  // Trigger synthetic events to ensure React listeners catch it
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
  
  return true;
}

function getStepBehavior(step: Step | undefined): string | null {
  const data = step?.data;

  if (typeof data !== 'object' || data === null || !('behavior' in data)) {
    return null;
  }

  const behavior = (data as { behavior?: unknown }).behavior;
  return typeof behavior === 'string' ? behavior : null;
}

function ensureUserMenuOpen(isMobile: boolean): number {
  const panelSelector = getBusinessUserDashboardTourTargetSelector(
    isMobile ? 'mobileMenuPanel' : 'userDropdownMenu',
  );

  if (queryTourTarget(panelSelector)) {
    return 0;
  }

  const triggerSelector = getBusinessUserDashboardTourTargetSelector(
    isMobile ? 'mobileMenuTrigger' : 'userDropdownTrigger',
  );

  return clickTourTarget(triggerSelector) ? 180 : 0;
}

function closeUserMenuIfOpen(): number {
  const desktopPanelSelector = getBusinessUserDashboardTourTargetSelector('userDropdownMenu');
  const mobilePanelSelector = getBusinessUserDashboardTourTargetSelector('mobileMenuPanel');

  if (queryTourTarget(desktopPanelSelector)) {
    const backdrop = queryTourTarget('#tour-user-dropdown-backdrop');
    if (backdrop) {
      backdrop.click();
    } else {
      clickTourTarget(getBusinessUserDashboardTourTargetSelector('userDropdownTrigger'));
    }
    return 200;
  }

  if (queryTourTarget(mobilePanelSelector)) {
    clickTourTarget(getBusinessUserDashboardTourTargetSelector('mobileMenuTrigger'));
    return 200;
  }

  return 0;
}

function ensureLearningPathsVisible(): number {
  if (queryTourTarget(getBusinessUserDashboardTourTargetSelector('learningPathSection'))) {
    return 0;
  }

  return clickTourTarget(
    getBusinessUserDashboardTourTargetSelector('courseViewGridButton'),
  )
    ? 180
    : 0;
}

function prepareBusinessUserStep(step: Step | undefined, isMobile: boolean): number {
  const behavior = getStepBehavior(step);

  if (behavior === businessUserJoyrideConfig.BUSINESS_USER_TOUR_STEP_BEHAVIOR.openUserMenu) {
    return ensureUserMenuOpen(isMobile);
  }

  const closeMenuDelay = closeUserMenuIfOpen();

  if (behavior === businessUserJoyrideConfig.BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths) {
    return Math.max(closeMenuDelay, ensureLearningPathsVisible());
  }

  return closeMenuDelay;
}

function resolveBusinessUserJoyrideSteps(
  isMobile: boolean,
  hasCourseControls: boolean,
  hasLearningPaths: boolean,
  t: businessUserJoyrideConfig.BusinessUserJoyrideTranslator,
): Step[] {
  if (
    typeof businessUserJoyrideConfig.buildBusinessUserJoyrideSteps === 'function'
  ) {
    return businessUserJoyrideConfig.buildBusinessUserJoyrideSteps({
      hasCourseControls,
      hasLearningPaths,
      isMobile,
      t,
    });
  }

  if (Array.isArray(businessUserJoyrideConfig.businessUserJoyrideSteps)) {
    return businessUserJoyrideConfig.businessUserJoyrideSteps;
  }

  return [];
}

export function useBusinessUserJoyride(
  options: UseBusinessUserJoyrideOptions = {},
) {
  const {
    enabled = true,
    hasCourseControls = true,
    hasLearningPaths = true,
    mobilePerformanceMode = false,
  } = options;
  const { setRestart } = useTourRestart();
  const { t } = useTranslation('common');
  const { t: tBusiness } = useTranslation('business');

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
  const stepTransitionIdRef = useRef(0);

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
    return resolveBusinessUserJoyrideSteps(
      isMobile,
      hasCourseControls,
      hasLearningPaths,
      tBusiness,
    );
  }, [hasCourseControls, hasLearningPaths, isMobile, tBusiness]);

  const runnableSteps = useMemo(() => {
    return steps;
  }, [steps]);

  const finishTourFromMissingTargets = useCallback(() => {
    setRun(false);
    setIsTourFinishedInSession(true);
    closeUserMenuIfOpen();
    completeTour().catch((err) =>
      console.error('[useBusinessUserJoyride] Complete failed (no available targets)', err),
    );
  }, [completeTour]);

  const moveToStep = useCallback(
    (requestedIndex: number, direction: 'next' | 'prev' = 'next') => {
      const transitionId = stepTransitionIdRef.current + 1;
      stepTransitionIdRef.current = transitionId;

      void (async () => {
        const stepDelta = direction === 'prev' ? -1 : 1;
        let candidateIndex = requestedIndex;

        while (candidateIndex >= 0 && candidateIndex < steps.length) {
          const candidateStep = steps[candidateIndex];
          const delay = prepareBusinessUserStep(candidateStep, isMobile);
          await wait(delay);

          const targetReady = candidateStep
            ? await waitForJoyrideTargetReady(
                candidateStep.target,
                BUSINESS_USER_STEP_TARGET_TIMEOUT_MS,
              )
            : false;

          if (transitionId !== stepTransitionIdRef.current) {
            return;
          }

          if (targetReady) {
            setStepIndex(candidateIndex);
            return;
          }

          console.warn(
            '[useBusinessUserJoyride] Skipping unavailable step target',
            candidateIndex,
            candidateStep?.target,
          );
          candidateIndex += stepDelta;
        }

        finishTourFromMissingTargets();
      })();
    },
    [finishTourFromMissingTargets, isMobile, steps],
  );

  useEffect(() => {
    if (
      !enabled ||
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
  }, [enabled, isLoading, shouldShowTour, isTourFinishedInSession, run, showVideoIntro]);

  const handleVideoComplete = useCallback(() => {
    console.log('[useBusinessUserJoyride] Video complete, preparing to start tour');
    setShowVideoIntro(false);
    setStepIndex(0);

    // Larger delay (700ms vs the old 300ms) so the hero banner's slide-in
    // animation (motion.div with y: -20 → 0) completes before Joyride
    // computes the spotlight rect.  Previously the spotlight was captured
    // mid-animation and ended up pointing at "nothing" — the tooltip would
    // appear briefly and then the overlay would persist with no highlight.
    setTimeout(() => {
      console.log('[useBusinessUserJoyride] Starting Joyride with', runnableSteps.length, 'steps');
      void (async () => {
        prepareBusinessUserStep(steps[0], isMobile);
        const targetReady = await waitForJoyrideStepTargetReady(
          steps[0],
          'useBusinessUserJoyride',
        );
        if (!targetReady) {
          setIsTourFinishedInSession(true);
          closeUserMenuIfOpen();
          return;
        }

        startTour().catch((err) =>
          console.error('[useBusinessUserJoyride] DB start failed', err),
        );
        setRun(true);
      })();
    }, 700);
  }, [isMobile, runnableSteps.length, startTour, steps]);

  const targetNotFoundRetryCount = useRef(0);

  const handleJoyrideCallback = useCallback(
    (data: EventData) => {
      const { action, index, status, type } = data;

      // Track consecutive TARGET_NOT_FOUND events.  If we hit the same step
      // twice in a row without finding the target, give up and either
      // advance past it or finish the tour — don't loop forever.
      if (type === EVENTS.TARGET_NOT_FOUND) {
        targetNotFoundRetryCount.current += 1;
        console.warn(
          '[useBusinessUserJoyride] TARGET_NOT_FOUND on step',
          index,
          '— retry',
          targetNotFoundRetryCount.current,
        );
        if (targetNotFoundRetryCount.current > 2) {
          targetNotFoundRetryCount.current = 0;
          if (index >= runnableSteps.length - 1) {
            setRun(false);
            setIsTourFinishedInSession(true);
            closeUserMenuIfOpen();
            completeTour().catch((err) =>
              console.error('[useBusinessUserJoyride] Complete failed (target not found)', err),
            );
            return;
          }
        }
      } else if (type === EVENTS.STEP_AFTER) {
        targetNotFoundRetryCount.current = 0;
      }

      if (status === STATUS.FINISHED) {
        console.log('[useBusinessUserJoyride] Tour finished');
        setRun(false);
        setIsTourFinishedInSession(true);
        closeUserMenuIfOpen();
        completeTour().catch((err) =>
          console.error('[useBusinessUserJoyride] Complete failed', err),
        );
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
        console.log('[useBusinessUserJoyride] Tour skipped');
        setRun(false);
        setIsTourFinishedInSession(true);
        closeUserMenuIfOpen();
        skipTour().catch((err) =>
          console.error('[useBusinessUserJoyride] Skip failed', err),
        );
        return;
      }

      if (action === ACTIONS.CLOSE) {
        console.log('[useBusinessUserJoyride] Tour closed');
        setRun(false);
        setIsTourFinishedInSession(true);
        closeUserMenuIfOpen();
        skipTour().catch((err) =>
          console.error('[useBusinessUserJoyride] Close failed', err),
        );
        return;
      }

      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        if (action === ACTIONS.PREV) {
          moveToStep(Math.max(0, index - 1), 'prev');
          return;
        }

        // If we're on the last step and moving forward, finish the tour
        if (index >= runnableSteps.length - 1) {
          console.log('[useBusinessUserJoyride] Last step reached, finishing tour');
          setRun(false);
          setIsTourFinishedInSession(true);
          closeUserMenuIfOpen();
          completeTour().catch((err) =>
            console.error('[useBusinessUserJoyride] Complete failed (last step)', err),
          );
          return;
        }

        moveToStep(index + 1, 'next');
      }
    },
    [completeTour, moveToStep, runnableSteps.length, skipTour],
  );

  const resetTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    closeUserMenuIfOpen();
  }, []);

  const manualStartTour = useCallback(() => {
    console.log('[useBusinessUserJoyride] Manually restarting tour');
    closeUserMenuIfOpen();
    setStepIndex(0);
    setRun(false);
    setIsTourFinishedInSession(false);

    setShowVideoIntro(true);
  }, []);

  useEffect(() => {
    setRestart(manualStartTour, t('tour.restart'));
    return () => setRestart(null);
  }, [manualStartTour, setRestart, t]);

  // Safety net: if the tour is running but stays on the same step for more
  // than 45 seconds, dismiss it instead of leaving the user trapped under
  // the dark overlay.  Triggered by stuck states like a target element
  // that's invisible or scrolled out of view — historically the tour
  // could enter a state with overlay visible but no tooltip rendered.
  useEffect(() => {
    if (!run) return;
    const watchdog = window.setTimeout(() => {
      console.warn(
        '[useBusinessUserJoyride] Watchdog: tour stuck on step',
        stepIndex,
        '— auto-dismissing',
      );
      setRun(false);
      setIsTourFinishedInSession(true);
      closeUserMenuIfOpen();
      skipTour().catch((err) =>
        console.error('[useBusinessUserJoyride] Watchdog skipTour failed', err),
      );
    }, 45_000);
    return () => window.clearTimeout(watchdog);
  }, [run, stepIndex, skipTour]);

  return {
    joyrideProps: {
      steps: runnableSteps,
      run,
      stepIndex,
      callback: handleJoyrideCallback,
      continuous: true,
      showProgress: false,
      showSkipButton: true,
      hideCloseButton: false,
      disableOverlayClose: false,
      disableCloseOnEsc: false,
      disableScrolling: false,
      scrollToFirstStep: true,
      scrollOffset: isMobile ? 88 : 120,
      spotlightClicks: true,
      spotlightPadding: isMobile ? 12 : 8,
      tooltipComponent: JoyrideTooltip,
      styles: {
        options: {
          zIndex: 999999,
          arrowColor: '#1E2329',
        },
        spotlight: {
          borderRadius: 16,
          zIndex: 1000000,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          pointerEvents: 'none',
        },
      },
      floaterProps: {
        disableAnimation: isMobile,
        hideArrow: false,
        offset: isMobile ? 10 : 15,
        styles: {
          floater: {
            zIndex: 1000001,
            filter: isMobile
              ? 'none'
              : 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
          },
        },
      },
      locale: {
        back: t('actions.back'),
        close: t('actions.close'),
        last: t('actions.finish'),
        next: t('actions.next'),
        skip: t('actions.skip'),
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
