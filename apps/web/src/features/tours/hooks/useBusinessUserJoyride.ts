'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ACTIONS, CallBackProps, EVENTS, STATUS, type Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import {
  getBusinessUserDashboardTourTargetSelector,
} from '../../../core/constants/tourTargets';
import { useTourRestart } from '../../../core/contexts/TourRestartContext';
import * as businessUserJoyrideConfig from '../config/business-user-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourProgress } from './useTourProgress';

interface UseBusinessUserJoyrideOptions {
  enabled?: boolean;
  hasCourseControls?: boolean;
  hasLearningPaths?: boolean;
  mobilePerformanceMode?: boolean;
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

  element.click();
  return true;
}

function targetExists(step: Step): boolean {
  if (typeof document === 'undefined') {
    return true;
  }

  if (typeof step.target !== 'string') {
    return true;
  }

  return queryTourTarget(step.target) !== null;
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
    clickTourTarget(getBusinessUserDashboardTourTargetSelector('userDropdownTrigger'));
    return 140;
  }

  if (queryTourTarget(mobilePanelSelector)) {
    clickTourTarget(getBusinessUserDashboardTourTargetSelector('mobileMenuTrigger'));
    return 140;
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
): Step[] {
  if (
    typeof businessUserJoyrideConfig.buildBusinessUserJoyrideSteps === 'function'
  ) {
    return businessUserJoyrideConfig.buildBusinessUserJoyrideSteps({
      hasCourseControls,
      hasLearningPaths,
      isMobile,
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
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);
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
    return resolveBusinessUserJoyrideSteps(
      isMobile,
      hasCourseControls,
      hasLearningPaths,
    );
  }, [hasCourseControls, hasLearningPaths, isMobile]);

  const moveToStep = useCallback(
    (nextIndex: number) => {
      const tourSteps = activeSteps.length > 0 ? activeSteps : steps;
      const nextStep = tourSteps[nextIndex];
      const delay = prepareBusinessUserStep(nextStep, isMobile);

      if (delay > 0) {
        window.setTimeout(() => setStepIndex(nextIndex), delay);
        return;
      }

      setStepIndex(nextIndex);
    },
    [activeSteps, isMobile, steps],
  );

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
  }, [enabled, isLoading, shouldShowTour, isTourFinishedInSession, mobilePerformanceMode, run, showVideoIntro]);

  const handleVideoComplete = useCallback(() => {
    console.log('[useBusinessUserJoyride] Video complete, preparing to start tour');
    setShowVideoIntro(false);
    setStepIndex(0);
    
    // We use a small timeout to let the DOM settle after the video modal closes
    // This ensures elements like the SofLIA button are correctly positioned for Joyride
    setTimeout(() => {
      const runnableSteps = steps.filter(targetExists);
      setActiveSteps(runnableSteps);

      if (runnableSteps.length === 0) {
        console.warn('[useBusinessUserJoyride] No steps found, completing tour');
        completeTour().catch((err) =>
          console.error('[useBusinessUserJoyride] No steps available:', err),
        );
        return;
      }

      console.log('[useBusinessUserJoyride] Starting Joyride with', runnableSteps.length, 'steps');
      startTour().catch((err) =>
        console.error('[useBusinessUserJoyride] DB start failed', err),
      );
      prepareBusinessUserStep(runnableSteps[0], isMobile);
      setRun(true);
    }, 300);
  }, [completeTour, isMobile, startTour, steps]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, status, type } = data;

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
        const currentStepCount = activeSteps.length > 0 ? activeSteps.length : steps.length;

        if (action === ACTIONS.PREV) {
          moveToStep(Math.max(0, index - 1));
          return;
        }

        // If we're on the last step and moving forward, finish the tour
        if (index >= currentStepCount - 1) {
          console.log('[useBusinessUserJoyride] Last step reached, finishing tour');
          setRun(false);
          setIsTourFinishedInSession(true);
          closeUserMenuIfOpen();
          completeTour().catch((err) =>
            console.error('[useBusinessUserJoyride] Complete failed (last step)', err),
          );
          return;
        }

        moveToStep(index + 1);
      }
    },
    [activeSteps.length, completeTour, moveToStep, skipTour, steps.length],
  );

  const resetTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    setActiveSteps([]);
    closeUserMenuIfOpen();
  }, []);

  const manualStartTour = useCallback(() => {
    console.log('[useBusinessUserJoyride] Manually restarting tour');
    closeUserMenuIfOpen();
    setStepIndex(0);
    setActiveSteps([]);
    setRun(false);
    setIsTourFinishedInSession(false);

    if (mobilePerformanceMode) {
      const runnableSteps = steps.filter(targetExists);
      setActiveSteps(runnableSteps);
      setShowVideoIntro(false);

      if (runnableSteps.length === 0) {
        return;
      }

      startTour().catch((err) =>
        console.error('[useBusinessUserJoyride] Manual mobile start failed', err),
      );
      prepareBusinessUserStep(runnableSteps[0], isMobile);
      setRun(true);
      return;
    }

    setShowVideoIntro(true);
  }, [isMobile, mobilePerformanceMode, startTour, steps]);

  useEffect(() => {
    setRestart(manualStartTour, t('tour.restart'));
    return () => setRestart(null);
  }, [manualStartTour, setRestart, t]);

  return {
    joyrideProps: {
      steps: activeSteps.length > 0 ? activeSteps : steps.filter(targetExists),
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
          zIndex: 100000,
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
