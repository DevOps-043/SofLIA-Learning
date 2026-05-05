// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import {
  ACTIONS,
  EVENTS,
  LIFECYCLE,
  STATUS,
  type CallBackProps,
  type Step,
} from 'react-joyride';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFeatureTour } from '../useFeatureTour';

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

  it('advances past missing targets instead of leaving the overlay stuck', () => {
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

    expect(result.current.stepIndex).toBe(1);
    expect(updateStep).toHaveBeenCalledWith(1);
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
});
