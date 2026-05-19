'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ACTIONS, CallBackProps, EVENTS, STATUS } from 'react-joyride';

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

const TOUR_START_DELAY_MS = 1500;
const TOUR_RESTART_DELAY_MS = 120;
const TOUR_LAYOUT_SYNC_DELAY_MS = 180;
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

function scrollStepTargetIntoView(
  nextStepIndex: number,
  stepTarget: string | HTMLElement,
): void {
  if (
    !SCROLLABLE_STEP_INDEXES.has(nextStepIndex) ||
    typeof stepTarget !== 'string'
  ) {
    return;
  }

  const element = document.querySelector(stepTarget);

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
  const steps = useMemo(
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

  const pendingAutoTour = !mobilePerformanceMode && shouldShowTour
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
    async (nextStepIndex: number) => {
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
      const nextStep = steps[nextStepIndex];

      if (nextStep) {
        scrollStepTargetIntoView(nextStepIndex, nextStep.target);
        await waitForLayoutSync();
      }
    },
    [closeLeftPanel, closeLia, isMobile, openLeftPanel, setActiveTab, steps],
  );

  const launchTour = useCallback(async () => {
    setIsTourActive(true);
    await prepareStep(COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome);

    setRun(false);
    setStepIndex(COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome);
    void startTour();

    window.setTimeout(() => {
      setRun(true);
    }, TOUR_RESTART_DELAY_MS);
  }, [prepareStep, startTour]);

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

        if (nextStepIndex >= steps.length) {
          await finishTour();
          return;
        }

        await prepareStep(nextStepIndex);
        setStepIndex(nextStepIndex);
        updateStep(nextStepIndex); // debounced fire-and-forget
      }
    },
    [dismissTour, finishTour, prepareStep, steps.length, updateStep],
  );

  const joyrideProps = useMemo(
    () => ({
      steps,
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
    [handleJoyrideCallback, isMobile, run, stepIndex, steps],
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
