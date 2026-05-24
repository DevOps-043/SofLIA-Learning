// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { ACTIONS, EVENTS, LIFECYCLE, STATUS, type EventData, type Step } from 'react-joyride';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useJoyrideMinitour } from '../useJoyrideMinitour';

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
    skipBeacon: true,
  },
  {
    target: '#second',
    title: 'second.title',
    content: 'second.content',
    skipBeacon: true,
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

function appendTourTarget(id: string): HTMLElement {
  const element = document.createElement('div');
  element.id = id;
  element.getBoundingClientRect = vi.fn(() => ({
    bottom: 120,
    height: 80,
    left: 20,
    right: 220,
    toJSON: () => '',
    top: 40,
    width: 200,
    x: 20,
    y: 40,
  }));
  document.body.appendChild(element);
  return element;
}

function buildCallbackProps(overrides: Partial<EventData> = {}): EventData {
  return {
    action: ACTIONS.NEXT,
    controlled: true,
    error: null,
    index: 0,
    lifecycle: LIFECYCLE.COMPLETE,
    origin: null,
    scroll: null,
    scrolling: false,
    size: steps.length,
    status: STATUS.RUNNING,
    step: steps[0],
    type: EVENTS.STEP_AFTER,
    waiting: false,
    ...overrides,
  } as EventData;
}

describe('useJoyrideMinitour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tourProgressState.isLoading = false;
    tourProgressState.shouldShowTour = false;
    vi.useRealTimers();
    document.body.innerHTML = '';
    appendTourTarget('first');
    appendTourTarget('second');
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
      await Promise.resolve();
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
