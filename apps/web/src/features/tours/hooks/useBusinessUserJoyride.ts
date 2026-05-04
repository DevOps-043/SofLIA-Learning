'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ACTIONS, CallBackProps, EVENTS, STATUS, type Step } from 'react-joyride';
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

function targetExists(step: Step): boolean {
  if (typeof document === 'undefined') {
    return true;
  }

  if (typeof step.target !== 'string') {
    return true;
  }

  return document.querySelector(step.target) instanceof HTMLElement;
}

function targetIsVisible(step: Step): boolean {
  if (typeof document === 'undefined' || typeof step.target !== 'string') {
    return true;
  }

  const element = document.querySelector(step.target);
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.closest('[hidden], [aria-hidden="true"], .hidden')) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    Number(style.opacity) === 0
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
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
    // We provide all steps to Joyride.
    // If a target doesn't exist yet (e.g. menu not open), Joyride emits TARGET_NOT_FOUND
    // and our callback handles opening the menu or moving to the next step.
    return steps;
  }, [steps]);

  const moveToStep = useCallback(
    (nextIndex: number) => {
      const nextStep = steps[nextIndex];
      const delay = prepareBusinessUserStep(nextStep, isMobile);

      if (delay > 0) {
        window.setTimeout(() => setStepIndex(nextIndex), delay);
        return;
      }

      setStepIndex(nextIndex);
    },
    [isMobile, steps],
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
    
    // We use a small timeout to let the DOM settle after the video modal closes
    setTimeout(() => {
      console.log('[useBusinessUserJoyride] Starting Joyride with', runnableSteps.length, 'steps');
      startTour().catch((err) =>
        console.error('[useBusinessUserJoyride] DB start failed', err),
      );
      prepareBusinessUserStep(steps[0], isMobile);
      setRun(true);
    }, 300);
  }, [isMobile, runnableSteps.length, startTour, steps]);

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
        if (action === ACTIONS.PREV) {
          moveToStep(Math.max(0, index - 1));
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

        moveToStep(index + 1);
      }
    },
    [completeTour, moveToStep, skipTour, steps.length],
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
          zIndex: 999999,
          arrowColor: '#1E2329',
        },
        spotlight: {
          borderRadius: 16,
          zIndex: 1000000,
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
