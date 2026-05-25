import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect, useCallback } from 'react';
import { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTourProgress } from './useTourProgress';
import { studyPlannerJoyrideSteps } from '../config/study-planner-joyride-config';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourRestart } from '@/core/contexts/TourRestartContext';
import type { SofliaJoyrideEvent as CallBackProps } from '../types/joyride';

export const useStudyPlannerJoyride = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFinishedInSession, setIsFinishedInSession] = useState(false);
  const tourProgress = useTourProgress('study-planner-joyride-v1');
  const {
    completeTour,
    hasSeenTour,
    isLoading,
    skipTour,
    startTour,
  } = tourProgress;
  const { setRestart } = useTourRestart();

  // Initiate tour check on mount
  useEffect(() => {
    const checkTourStatus = () => {
      if (!isLoading) {
        // If tour hasn't been seen, start it
        if (!hasSeenTour && !isFinishedInSession) {
          // Small delay to ensure elements are rendered
          const timer = setTimeout(() => {
             startTour().catch((err) =>
               techDebtLogger.error('[useStudyPlannerJoyride] DB start failed', err),
             );
             setRun(true);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    };
    return checkTourStatus();
  }, [hasSeenTour, isFinishedInSession, isLoading, startTour]);

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Handle close button click
    if (action === ACTIONS.CLOSE) {
      setRun(false);
      setStepIndex(0);
      setIsFinishedInSession(true);
      await skipTour();
      return;
    }

    // Handle skip button click
    if (action === ACTIONS.SKIP) {
      setRun(false);
      setStepIndex(0);
      setIsFinishedInSession(true);
      await skipTour();
      return;
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      setIsFinishedInSession(true);

      if (status === STATUS.FINISHED) {
        await completeTour();
      } else {
        await skipTour();
      }
      return;
    }

    // TARGET_NOT_FOUND: el step no encontro su elemento. NO avanzar: si se
    // trata igual que STEP_AFTER, una pulsacion de "Siguiente" cuyo target
    // siguiente todavia no esta listo dispara una cascada que recorre todos
    // los steps en un solo evento y termina el tour de golpe.
    if (type === EVENTS.TARGET_NOT_FOUND) {
      techDebtLogger.warn(
        '[useStudyPlannerJoyride] TARGET_NOT_FOUND on step',
        index,
      );
      return;
    }

    // Controlled navigation logic
    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === ACTIONS.PREV ? Math.max(0, index - 1) : index + 1;

      if (nextIndex >= studyPlannerJoyrideSteps.length) {
        setRun(false);
        setStepIndex(0);
        setIsFinishedInSession(true);
        await completeTour();
        return;
      }

      setStepIndex(nextIndex);
    }
  }, [completeTour, skipTour]);

  const restartTour = useCallback(() => {
    setStepIndex(0);
    setIsFinishedInSession(false);
    startTour().catch((err) =>
      techDebtLogger.error('[useStudyPlannerJoyride] DB restart failed', err),
    );
    setRun(true);
  }, [startTour]);

  useEffect(() => {
    setRestart(restartTour, 'Reiniciar tutorial');
    return () => setRestart(null);
  }, [restartTour, setRestart]);

  const joyrideProps = {
    run,
    steps: studyPlannerJoyrideSteps,
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
};
