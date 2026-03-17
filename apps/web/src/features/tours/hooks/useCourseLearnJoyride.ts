import { useState, useCallback, useEffect } from 'react';
import { CallBackProps, EVENTS, STATUS, ACTIONS } from 'react-joyride';
import { useTourProgress } from './useTourProgress';
import { COURSE_LEARN_TOUR_ID, courseLearnJoyrideSteps } from '../config/course-learn-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourRestart } from '@/core/contexts/TourRestartContext';

export const useCourseLearnJoyride = () => {
  const {
    hasSeenTour,
    shouldShowTour,
    isLoading,
    completeTour,
    skipTour
  } = useTourProgress(COURSE_LEARN_TOUR_ID);

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { setRestart } = useTourRestart();

  // Check if tour should run when data is loaded
  useEffect(() => {
    if (!isLoading && !hasSeenTour && shouldShowTour) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasSeenTour, shouldShowTour]);

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { action, index, status, type, step } = data;

    // Handle close button click
    if (action === ACTIONS.CLOSE) {
      setRun(false);
      setStepIndex(0);
      await skipTour();
      return;
    }

    // Handle skip button click
    if (action === ACTIONS.SKIP) {
      setRun(false);
      setStepIndex(0);
      await skipTour();
      return;
    }

    // Handle controlled navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }

    // UI Interactions logic
    if (type === EVENTS.STEP_BEFORE) {
      // LIA Panel Interaction
      if (step.data?.liaAction === 'open') {
        const liaButton = document.getElementById('tour-lia-course-button');
        if (liaButton) {
          liaButton.click();
        }
      }
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      await completeTour();
    }
  }, [completeTour, skipTour]);

  const restartTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    setTimeout(() => setRun(true), 100);
  }, []);

  useEffect(() => {
    setRestart(restartTour, 'Reiniciar tutorial');
    return () => setRestart(null);
  }, [restartTour, setRestart]);

  const joyrideProps = {
    run,
    steps: courseLearnJoyrideSteps,
    stepIndex,
    continuous: true,
    scrollToFirstStep: true,
    showProgress: true,
    showSkipButton: true,
    hideCloseButton: false,
    disableOverlayClose: true,
    disableCloseOnEsc: true,
    disableScrolling: false,
    scrollOffset: 120,
    spotlightClicks: false,
    spotlightPadding: 10,
    tooltipComponent: JoyrideTooltip,
    callback: handleJoyrideCallback,
    styles: {
      options: {
        zIndex: 10000,
        primaryColor: '#00D4B3',
        textColor: '#FFFFFF',
        backgroundColor: '#1E2329',
        arrowColor: '#1E2329',
      },
      spotlight: {
        borderRadius: 12,
        boxShadow: '0 0 0 4px rgba(0, 212, 179, 0.6), 0 0 20px 8px rgba(0, 212, 179, 0.4), 0 0 40px 16px rgba(0, 212, 179, 0.2)',
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
  };

  return { joyrideProps, restartTour };
};
