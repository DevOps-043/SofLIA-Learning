// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { ACTIONS, EVENTS, LIFECYCLE, STATUS } from 'react-joyride';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useJoyrideMinitour } from '../useJoyrideMinitour';
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
    disableBeacon: true,
  },
  {
    target: '#second',
    title: 'second.title',
    content: 'second.content',
    disableBeacon: true,
  },
];

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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

describe('useJoyrideMinitour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tourProgressState.isLoading = false;
    tourProgressState.shouldShowTour = false;
    vi.useRealTimers();
  });

  it('registers a restart handler when enabled', () => {
    renderHook(() =>
      useJoyrideMinitour({
        label: 'Replay tour',
        steps,
        tourId: 'test-tour',
      }),
    );

    expect(setRestart).toHaveBeenCalledWith(expect.any(Function), 'Replay tour');
  });

  it('auto-starts when the tour has not been seen', async () => {
    vi.useFakeTimers();
    tourProgressState.shouldShowTour = true;

    const { result } = renderHook(() =>
      useJoyrideMinitour({
        startDelayMs: 50,
        steps,
        tourId: 'test-tour',
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(startTour).toHaveBeenCalledTimes(1);
    expect(result.current.run).toBe(true);
  });

  it('updates the step index and progress when advancing', () => {
    const { result } = renderHook(() =>
      useJoyrideMinitour({
        steps,
        tourId: 'test-tour',
      }),
    );

    act(() => {
      result.current.restartTour();
    });

    act(() => {
      result.current.joyrideProps.callback(buildCallbackProps());
    });

    expect(result.current.stepIndex).toBe(1);
    expect(updateStep).toHaveBeenCalledWith(1);
  });

  it('completes when advancing past the final step', () => {
    const { result } = renderHook(() =>
      useJoyrideMinitour({
        steps,
        tourId: 'test-tour',
      }),
    );

    act(() => {
      result.current.joyrideProps.callback(
        buildCallbackProps({
          index: 1,
          step: steps[1],
        }),
      );
    });

    expect(completeTour).toHaveBeenCalledTimes(1);
  });

  it('skips when closed', () => {
    const { result } = renderHook(() =>
      useJoyrideMinitour({
        steps,
        tourId: 'test-tour',
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
  });
});
