import { useState, useEffect, useCallback } from 'react';
import { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useTourProgress } from '../../tours/hooks/useTourProgress';
import { studyPlannerDashboardJoyrideSteps } from '../../tours/config/study-planner-dashboard-joyride-config';
import { JoyrideTooltip } from '../../tours/components/JoyrideTooltip';

export function useStudyPlannerDashboardTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const tourProgress = useTourProgress('study-planner-dashboard-tour');

  // Initiate tour check on mount
  useEffect(() => {
    const checkTourStatus = async () => {
      if (!tourProgress.isLoading) {
        if (!tourProgress.hasSeenTour) {
           // Small delay to ensure elements are rendered
           setTimeout(() => {
              setRun(true);
           }, 1500); // 1.5s delay for dashboard to load
        }
      }
    };
    checkTourStatus();
  }, [tourProgress.isLoading, tourProgress.hasSeenTour]);

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Handle close button click
    if (action === ACTIONS.CLOSE) {
      setRun(false);
      setStepIndex(0);
      await tourProgress.skipTour();
      return;
    }

    // Handle skip button click
    if (action === ACTIONS.SKIP) {
      setRun(false);
      setStepIndex(0);
      await tourProgress.skipTour();
      return;
    }

    // Controlled navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }
    // Handle finish/skip via status
    else if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      if (status === STATUS.FINISHED) {
        await tourProgress.completeTour();
      } else {
        await tourProgress.skipTour();
      }
    }
  }, [tourProgress]);

  const restartTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    setTimeout(() => {
      setRun(true);
    }, 100);
  }, []);

  const joyrideProps = {
    run,
    steps: studyPlannerDashboardJoyrideSteps,
    stepIndex,
    callback: handleJoyrideCallback,
    continuous: true,
    showProgress: true,
    showSkipButton: true,
    disableOverlayClose: true,
    disableCloseOnEsc: true,
    tooltipComponent: JoyrideTooltip,
    scrollOffset: 120,
    styles: {
      options: {
        zIndex: 10000,
        primaryColor: '#00D4B3',
      },
    }
  };

  return { joyrideProps, restartTour, isRunning: run };
}
