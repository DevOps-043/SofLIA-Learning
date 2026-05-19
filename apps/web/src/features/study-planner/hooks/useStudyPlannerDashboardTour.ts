import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect, useCallback } from 'react';
import { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTourProgress } from '../../tours/hooks/useTourProgress';
import { studyPlannerDashboardJoyrideSteps } from '../../tours/config/study-planner-dashboard-joyride-config';
import { JoyrideTooltip } from '../../tours/components/JoyrideTooltip';
import type { SofliaJoyrideEvent as CallBackProps } from '../../tours/types/joyride';

export function useStudyPlannerDashboardTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFinishedInSession, setIsFinishedInSession] = useState(false);
  const {
    completeTour,
    hasSeenTour,
    isLoading,
    skipTour,
    startTour,
  } = useTourProgress('study-planner-dashboard-tour');

  // Initiate tour check on mount
  useEffect(() => {
    if (isLoading || hasSeenTour || isFinishedInSession || run) {
      return;
    }

    // Small delay to ensure elements are rendered.
    const timer = setTimeout(() => {
      startTour().catch((err) =>
        techDebtLogger.error('[useStudyPlannerDashboardTour] DB start failed', err),
      );
      setRun(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasSeenTour, isFinishedInSession, isLoading, run, startTour]);

  const stopTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    setIsFinishedInSession(true);
  }, []);

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
      if (status === STATUS.FINISHED) {
        await completeTour();
      } else {
        await skipTour();
      }
      return;
    }

    if (action === ACTIONS.CLOSE || action === ACTIONS.SKIP) {
      stopTour();
      await skipTour();
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = action === ACTIONS.PREV ? Math.max(0, index - 1) : index + 1;

      if (nextIndex >= studyPlannerDashboardJoyrideSteps.length) {
        stopTour();
        await completeTour();
        return;
      }

      setStepIndex(nextIndex);
    }
  }, [completeTour, skipTour, stopTour]);

  const restartTour = useCallback(() => {
    setStepIndex(0);
    setIsFinishedInSession(false);
    startTour().catch((err) =>
      techDebtLogger.error('[useStudyPlannerDashboardTour] DB restart failed', err),
    );
    setRun(true);
  }, [startTour]);

  const joyrideProps = {
    run,
    steps: studyPlannerDashboardJoyrideSteps,
    stepIndex,
    callback: handleJoyrideCallback,
    continuous: true,
    showProgress: true,
    showSkipButton: true,
    disableOverlayClose: false,
    disableCloseOnEsc: false,
    spotlightClicks: true,
    tooltipComponent: JoyrideTooltip,
    scrollOffset: 120,
    styles: {
      options: {
        zIndex: 10000,
        primaryColor: 'var(--color-accent)',
      },
      overlay: {
        pointerEvents: 'none',
      },
    }
  };

  return { joyrideProps, restartTour, isRunning: run };
}
