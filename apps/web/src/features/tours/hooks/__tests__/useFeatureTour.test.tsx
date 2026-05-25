// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import {
  ACTIONS,
  EVENTS,
  LIFECYCLE,
  STATUS,
} from 'react-joyride';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFeatureTour } from '../useFeatureTour';
import type { SofliaJoyrideEvent as CallBackProps, SofliaJoyrideStep as Step } from '../../types/joyride';

const completeTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const skipTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const startTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const updateStep = vi.fn<(step: number) => void>();
const setRestart = vi.fn();

const tourProgressState = {
  completeTour,
  isLoading: false,
  shouldShowTour: false,
  skipTour,
  startTour,
  updateStep,
};

const steps: Step[] = [
  {
    target: '#first',
    title: 'first.title',
    content: 'first.content',
  },
  {
    target: '#second',
    title: 'second.title',
    content: 'second.content',
  },
];

function cloneSteps(): Step[] {
  return steps.map((step) => ({ ...step }));
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock('../../../../core/contexts/TourRestartContext', () => ({
  useTourRestart: () => ({
    setRestart,
  }),
}));

vi.mock('../useTourProgress', () => ({
  useTourProgress: () => tourProgressState,
}));

function buildCallbackProps(overrides: Partial<CallBackProps> = {}): CallBackProps {
  return {
    action: ACTIONS.NEXT,
    controlled: true,
    index: 0,
    lifecycle: LIFECYCLE.COMPLETE,
    origin: null,
    size: steps.length,
    status: STATUS.RUNNING,
    step: steps[0],
    type: EVENTS.STEP_AFTER,
    ...overrides,
  };
}

describe('useFeatureTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    tourProgressState.isLoading = false;
    tourProgressState.shouldShowTour = false;
  });

  it('completes and closes when advancing past the final step', () => {
    const { result } = renderHook(() =>
      useFeatureTour({
        steps,
        tourId: 'admin-users-tour',
      }),
    );

    act(() => {
      result.current.startTour();
    });

    expect(result.current.run).toBe(true);

    act(() => {
      result.current.joyrideProps.callback(
        buildCallbackProps({
          index: 1,
          step: steps[1],
        }),
      );
    });

    expect(completeTour).toHaveBeenCalledTimes(1);
    expect(skipTour).not.toHaveBeenCalled();
    expect(result.current.run).toBe(false);
    expect(result.current.stepIndex).toBe(0);
  });

  it('does not advance on TARGET_NOT_FOUND so a single Next click cannot cascade through every step', () => {
    const { result } = renderHook(() =>
      useFeatureTour({
        steps,
        tourId: 'admin-users-tour',
      }),
    );

    act(() => {
      result.current.joyrideProps.callback(
        buildCallbackProps({
          type: EVENTS.TARGET_NOT_FOUND,
        }),
      );
    });

    // Tour stays on the current step; user can close/skip manually.
    expect(result.current.stepIndex).toBe(0);
    expect(updateStep).not.toHaveBeenCalled();
    expect(completeTour).not.toHaveBeenCalled();
    expect(skipTour).not.toHaveBeenCalled();
  });

  it('skips when the close action is emitted', () => {
    const { result } = renderHook(() =>
      useFeatureTour({
        steps,
        tourId: 'admin-users-tour',
      }),
    );

    act(() => {
      result.current.joyrideProps.callback(
        buildCallbackProps({
          action: ACTIONS.CLOSE,
        }),
      );
    });

    expect(skipTour).toHaveBeenCalledTimes(1);
    expect(result.current.run).toBe(false);
  });

  it('keeps the restart registration stable when the steps array identity changes', () => {
    const { rerender } = renderHook(
      ({ tourSteps }: { tourSteps: Step[] }) =>
        useFeatureTour({
          steps: tourSteps,
          tourId: 'admin-users-tour',
        }),
      {
        initialProps: { tourSteps: cloneSteps() },
      },
    );

    expect(setRestart).toHaveBeenCalledTimes(1);

    rerender({ tourSteps: cloneSteps() });

    expect(setRestart).toHaveBeenCalledTimes(1);
  });
});
