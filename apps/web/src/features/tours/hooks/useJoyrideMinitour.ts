'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ACTIONS, EVENTS, STATUS } from 'react-joyride';

import { useTourRestart } from '../../../core/contexts/TourRestartContext';
import { JoyrideTooltip } from '../components/JoyrideTooltip';
import { useTourProgress } from './useTourProgress';
import type { SofliaJoyrideEvent as CallBackProps, SofliaJoyrideStep as Step } from '../types/joyride';

interface UseJoyrideMinitourOptions {
  enabled?: boolean;
  label?: string;
  startDelayMs?: number;
  steps: Step[];
  tourId: string;
}

export function useJoyrideMinitour({
  enabled = true,
  label,
  startDelayMs = 1200,
  steps,
  tourId,
}: UseJoyrideMinitourOptions) {
  const { t } = useTranslation('common');
  const { setRestart } = useTourRestart();
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour, updateStep } =
    useTourProgress(tourId);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isFinishedInSession, setIsFinishedInSession] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stopTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    setIsFinishedInSession(true);
  }, []);

  const restartTour = useCallback(() => {
    setStepIndex(0);
    setIsFinishedInSession(false);
    startTour().catch((error) =>
      techDebtLogger.error(`[useJoyrideMinitour:${tourId}] start failed`, error),
    );
    setRun(true);
  }, [startTour, tourId]);

  useEffect(() => {
    if (!enabled || steps.length === 0) {
      setRestart(null);
      return;
    }

    setRestart(restartTour, label ?? t('tour.restart'));
    return () => setRestart(null);
  }, [enabled, label, restartTour, setRestart, steps.length, t]);

  useEffect(() => {
    if (
      !enabled ||
      isLoading ||
      !shouldShowTour ||
      isFinishedInSession ||
      run ||
      steps.length === 0
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      restartTour();
    }, startDelayMs);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    isFinishedInSession,
    isLoading,
    restartTour,
    run,
    shouldShowTour,
    startDelayMs,
    steps.length,
  ]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, status, type } = data;

      if (status === STATUS.FINISHED) {
        stopTour();
        completeTour().catch((error) =>
          techDebtLogger.error(`[useJoyrideMinitour:${tourId}] complete failed`, error),
        );
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
        stopTour();
        skipTour().catch((error) =>
          techDebtLogger.error(`[useJoyrideMinitour:${tourId}] skip failed`, error),
        );
        return;
      }

      // TARGET_NOT_FOUND: el step no encontro su elemento. NO avanzar: si se
      // trata igual que STEP_AFTER, una pulsacion de "Siguiente" cuyo target
      // siguiente todavia no esta listo dispara una cascada que recorre todos
      // los steps en un solo evento y termina el tour de golpe.
      if (type === EVENTS.TARGET_NOT_FOUND) {
        techDebtLogger.warn(
          `[useJoyrideMinitour:${tourId}] TARGET_NOT_FOUND on step ${index}`,
        );
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        const nextIndex = action === ACTIONS.PREV ? Math.max(0, index - 1) : index + 1;

        if (nextIndex >= steps.length) {
          stopTour();
          completeTour().catch((error) =>
            techDebtLogger.error(`[useJoyrideMinitour:${tourId}] complete failed`, error),
          );
          return;
        }

        setStepIndex(nextIndex);
        updateStep(nextIndex);
      }
    },
    [completeTour, skipTour, steps.length, stopTour, tourId, updateStep],
  );

  return {
    isMounted,
    restartTour,
    run,
    stepIndex,
    joyrideProps: {
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
      disableScrolling: false,
      scrollToFirstStep: true,
      scrollOffset: 120,
      spotlightClicks: true,
      spotlightPadding: 8,
      tooltipComponent: JoyrideTooltip,
      styles: {
        options: {
          zIndex: 999999,
          arrowColor: 'var(--color-gray-800)',
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
        hideArrow: false,
        offset: 15,
        styles: {
          floater: {
            zIndex: 1000001,
            filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
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
  };
}
