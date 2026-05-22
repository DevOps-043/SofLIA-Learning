'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ACTIONS, EVENTS, STATUS } from 'react-joyride';

import type { LearnTab } from '../../courses/components/learn/types';
import { useTourRestart } from '../../../core/contexts/TourRestartContext';
import {
  buildCourseLearnJoyrideSteps,
  buildCourseLearnTourId,
  COURSE_LEARN_JOYRIDE_STEP_INDEXES,
  type CourseLearnJoyrideTranslator,
} from '../config/course-learn-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourProgress } from './useTourProgress';
import type { SofliaJoyrideEvent as CallBackProps, SofliaJoyrideStep } from '../types/joyride';

const TOUR_START_DELAY_MS = 1500;
const TOUR_RESTART_DELAY_MS = 120;
const TOUR_LAYOUT_SYNC_DELAY_MS = 180;
const TOUR_TARGET_READY_TIMEOUT_MS = 2500;
const TOUR_TARGET_READY_POLL_MS = 50;
const TOUR_BEFORE_TIMEOUT_MS = 5000;
const SCROLLABLE_STEP_INDEXES = new Set<number>([
  COURSE_LEARN_JOYRIDE_STEP_INDEXES.videoPanel,
  COURSE_LEARN_JOYRIDE_STEP_INDEXES.tools,
]);

type UseCourseLearnJoyrideOptions = {
  courseSlug: string;
  courseTitle?: string;
  lessonTitle?: string;
  enabled?: boolean;
  isMobile: boolean;
  closeLia: () => void;
  openLeftPanel: () => void;
  closeLeftPanel: () => void;
  setActiveTab: (tab: LearnTab) => void;
  pauseVideoPlayback?: () => void;
  clearPendingAutoPlay?: () => void;
  mobilePerformanceMode?: boolean;
  /** Si se proporciona, el botón de restart del tour mostrará primero el intro video antes de lanzar el Joyride */
  restartWithIntroVideos?: (afterFn: () => void) => void;
};

function waitForLayoutSync(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, TOUR_LAYOUT_SYNC_DELAY_MS);
  });
}

function resolveStepTargetElement(
  stepTarget: SofliaJoyrideStep['target'],
): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  if (typeof stepTarget === 'string') {
    const element = document.querySelector(stepTarget);
    return element instanceof HTMLElement ? element : null;
  }

  if (stepTarget instanceof HTMLElement) {
    return stepTarget;
  }

  if (typeof stepTarget === 'function') {
    const element = stepTarget();
    return element instanceof HTMLElement ? element : null;
  }

  if (stepTarget && 'current' in stepTarget) {
    const element = stepTarget.current;
    return element instanceof HTMLElement ? element : null;
  }

  return null;
}

function isStepTargetReady(stepTarget: SofliaJoyrideStep['target']): boolean {
  const element = resolveStepTargetElement(stepTarget);

  if (!element) {
    return false;
  }

  const { display, visibility } = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return display !== 'none' && visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

function waitForStepTargetReady(
  stepTarget: SofliaJoyrideStep['target'],
): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const startedAt = Date.now();

  return new Promise((resolve) => {
    const checkTarget = () => {
      if (
        isStepTargetReady(stepTarget) ||
        Date.now() - startedAt >= TOUR_TARGET_READY_TIMEOUT_MS
      ) {
        resolve();
        return;
      }

      window.setTimeout(checkTarget, TOUR_TARGET_READY_POLL_MS);
    };

    checkTarget();
  });
}

function scrollStepTargetIntoView(
  nextStepIndex: number,
  stepTarget: SofliaJoyrideStep['target'],
): void {
  if (
    !SCROLLABLE_STEP_INDEXES.has(nextStepIndex) ||
    typeof stepTarget !== 'string'
  ) {
    return;
  }

  const element = resolveStepTargetElement(stepTarget);

  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.scrollIntoView({
    behavior: 'auto',
    block: 'start',
    inline: 'nearest',
  });
}

export function useCourseLearnJoyride({
  courseSlug,
  courseTitle,
  lessonTitle,
  enabled = true,
  isMobile,
  closeLia,
  openLeftPanel,
  closeLeftPanel,
  setActiveTab,
  pauseVideoPlayback,
  clearPendingAutoPlay,
  mobilePerformanceMode = false,
  restartWithIntroVideos,
}: UseCourseLearnJoyrideOptions) {
  const { t } = useTranslation('learn');
  const translate = useMemo<CourseLearnJoyrideTranslator>(
    () => (key, interpolation) => t(key, interpolation),
    [t],
  );
  const baseSteps = useMemo(
    () =>
      buildCourseLearnJoyrideSteps({
        courseTitle,
        lessonTitle,
        isMobile,
        translate,
      }),
    [courseTitle, isMobile, lessonTitle, translate],
  );
  const { setRestart } = useTourRestart();
  const {
    completeTour,
    isLoading,
    shouldShowTour,
    skipTour,
    startTour,
    updateStep,
  } = useTourProgress(buildCourseLearnTourId(courseSlug));

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);

  const pendingAutoTour = !mobilePerformanceMode && shouldShowTour;
  const suppressVideoPlayback =
    enabled && (isLoading || pendingAutoTour || isTourActive);
  const skipVideoAutoplay = enabled && (pendingAutoTour || isTourActive);

  const resetTourState = useCallback(() => {
    setRun(false);
    setStepIndex(COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome);
    setIsTourActive(false);
  }, []);

  const finishTour = useCallback(async () => {
    resetTourState();
    await completeTour();
  }, [completeTour, resetTourState]);

  const dismissTour = useCallback(async () => {
    resetTourState();
    await skipTour();
  }, [resetTourState, skipTour]);

  const prepareStep = useCallback(
    async (
      nextStepIndex: number,
      stepTarget: SofliaJoyrideStep['target'],
    ) => {
      closeLia();
      setActiveTab('video');

      if (nextStepIndex === COURSE_LEARN_JOYRIDE_STEP_INDEXES.sidebar) {
        if (isMobile) {
          closeLeftPanel();
        } else {
          openLeftPanel();
        }
      } else if (isMobile) {
        closeLeftPanel();
      }

      await waitForLayoutSync();
      await waitForStepTargetReady(stepTarget);
      scrollStepTargetIntoView(nextStepIndex, stepTarget);
      await waitForLayoutSync();
    },
    [closeLeftPanel, closeLia, isMobile, openLeftPanel, setActiveTab],
  );

  const tourSteps = useMemo(
    () =>
      baseSteps.map((step, index) => ({
        ...step,
        before: () => prepareStep(index, step.target),
        beforeTimeout: TOUR_BEFORE_TIMEOUT_MS,
        targetWaitTimeout: TOUR_TARGET_READY_TIMEOUT_MS,
      })),
    [baseSteps, prepareStep],
  );

  const launchTour = useCallback(() => {
    setIsTourActive(true);
    setRun(false);
    setStepIndex(COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome);
    void startTour();

    window.setTimeout(() => {
      setRun(true);
    }, TOUR_RESTART_DELAY_MS);
  }, [startTour]);

  useEffect(() => {
    if (!enabled || mobilePerformanceMode || isLoading || !shouldShowTour) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void launchTour();
    }, TOUR_START_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, isLoading, launchTour, mobilePerformanceMode, shouldShowTour]);

  const restartTour = useCallback(() => {
    if (restartWithIntroVideos) {
      restartWithIntroVideos(() => void launchTour());
    } else {
      void launchTour();
    }
  }, [launchTour, restartWithIntroVideos]);

  useEffect(() => {
    if (!enabled) {
      setIsTourActive(false);
      clearPendingAutoPlay?.();
      return;
    }

    if (!suppressVideoPlayback) {
      return;
    }

    clearPendingAutoPlay?.();
    pauseVideoPlayback?.();
  }, [
    clearPendingAutoPlay,
    enabled,
    pauseVideoPlayback,
    suppressVideoPlayback,
  ]);

  useEffect(() => {
    if (!enabled) {
      setRestart(null);
      return () => setRestart(null);
    }

    setRestart(restartTour, t('tour.courseLearnLabel'));
    return () => setRestart(null);
  }, [enabled, restartTour, setRestart, t]);

  const handleJoyrideCallback = useCallback(
    async (data: CallBackProps) => {
      const { action, index, status, type } = data;

      if (status === STATUS.FINISHED) {
        await finishTour();
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
        await dismissTour();
        return;
      }

      if (action === ACTIONS.CLOSE) {
        await dismissTour();
        return;
      }

      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        const nextStepIndex =
          action === ACTIONS.PREV ? index - 1 : index + 1;

        if (nextStepIndex < COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome) {
          return;
        }

        if (nextStepIndex >= tourSteps.length) {
          await finishTour();
          return;
        }

        setStepIndex(nextStepIndex);
        updateStep(nextStepIndex); // debounced fire-and-forget
      }
    },
    [dismissTour, finishTour, tourSteps.length, updateStep],
  );

  const joyrideProps = useMemo(
    () => ({
      steps: tourSteps,
      run,
      stepIndex,
      callback: handleJoyrideCallback,
      continuous: true,
      showProgress: false,
      showSkipButton: true,
      hideCloseButton: false,
      disableOverlayClose: false,
      disableCloseOnEsc: false,
      disableScrolling: true,
      scrollToFirstStep: true,
      scrollOffset: isMobile ? 72 : 120,
      spotlightClicks: true,
      spotlightPadding: isMobile ? 12 : 8,
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
    }),
    [handleJoyrideCallback, isMobile, run, stepIndex, tourSteps],
  );

  return {
    joyrideProps,
    restartTour,
    run,
    stepIndex,
    suppressVideoPlayback,
    skipVideoAutoplay,
  };
}
